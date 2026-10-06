import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View } from 'react-native';
import { EXTENSION_OPTIONS } from '../../../../constants/session';
import { formatEndTime } from '../../../../utils/formatters';
import { formatDuration } from '../../../../utils/spotInfo';
import { styles } from './styles';

/**
 * QuickExtend — adds time in one tap, with an inline undo instead of a
 * confirm dialog. Never offers more than the spot's posted limit allows.
 */
const QuickExtend = ({ onExtend, onUndo, canExtendBy, lastExtension, maxStayText, remainingAllowance }) => {
    const confirmation = lastExtension
        ? `Added ${formatDuration(lastExtension.minutes)}. Now ends at ${formatEndTime(new Date(lastExtension.newEnd))}.`
        : null;

    // iOS has no live regions; say the confirmation out loud.
    useEffect(() => {
        if (Platform.OS === 'ios' && confirmation) {
            AccessibilityInfo.announceForAccessibility(confirmation);
        }
    }, [confirmation]);

    let limitNote = null;
    if (maxStayText && remainingAllowance != null) {
        limitNote = remainingAllowance > 0
            ? `${maxStayText} max at this spot. You can add up to ${formatDuration(remainingAllowance)} more.`
            : `${maxStayText} max at this spot. You've reached the limit.`;
    }

    return (
        <View style={styles.extendSection}>
            <Text style={styles.sectionTitle}>Add time</Text>

            <View style={styles.extendRow}>
                {EXTENSION_OPTIONS.map((option) => {
                    const allowed = canExtendBy(option.minutes);
                    const amount = formatDuration(option.minutes);
                    return (
                        <Pressable
                            key={option.minutes}
                            onPress={() => onExtend(option.minutes)}
                            disabled={!allowed}
                            style={({ pressed }) => [
                                styles.extendButton,
                                !allowed && styles.extendButtonDisabled,
                                pressed && styles.pressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={allowed ? `Add ${amount}` : `Add ${amount}, past this spot's time limit`}
                            accessibilityState={{ disabled: !allowed }}
                        >
                            <Text
                                style={[styles.extendButtonText, !allowed && styles.extendButtonTextDisabled]}
                                numberOfLines={1}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {confirmation ? (
                <View style={styles.undoRow} accessibilityLiveRegion="polite">
                    <Text style={styles.undoText}>{confirmation}</Text>
                    <Pressable
                        onPress={onUndo}
                        hitSlop={12}
                        style={({ pressed }) => pressed && styles.pressed}
                        accessibilityRole="button"
                        accessibilityLabel={`Undo adding ${formatDuration(lastExtension.minutes)}`}
                    >
                        <Text style={styles.undoAction}>Undo</Text>
                    </Pressable>
                </View>
            ) : limitNote ? (
                <Text style={styles.extendNote}>{limitNote}</Text>
            ) : null}
        </View>
    );
};

export default QuickExtend;
