import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { DURATION_OPTIONS } from '../../../../constants/session';
import { TOKENS } from '../../../../constants/theme';
import { formatEndTime, formatMoney } from '../../../../utils/formatters';
import { calculateCost } from '../../../../utils/sessionHelpers';
import { styles } from './styles';

// "$3.00 per hour · 2 hours max"
const spotMeta = (spot) =>
    [spot?.priceText, spot?.maxStayText ? `${spot.maxStayText} max` : null]
        .filter(Boolean)
        .join(' · ');

/**
 * SetupCard — two decisions: where (optional) and how long.
 */
const SetupCard = ({
    timerSpot,
    suggestedSpot,
    onUseSpot,
    onClearSpot,
    onFindSpot,
    selectedDuration,
    setSelectedDuration,
    onStart,
}) => {
    const maxStay = timerSpot?.maxStayMinutes ?? null;
    const endsAt = new Date(Date.now() + selectedDuration * 60000);
    // An upper bound: the spot may be free for part of the time.
    const cost = timerSpot?.hourlyRate ? calculateCost(selectedDuration, timerSpot.hourlyRate) : null;

    return (
        <View style={styles.setupCard}>
            {/* Where — optional; a spot adds its rate and time limit. */}
            <Text style={styles.setupLabel}>Where you parked</Text>
            {timerSpot ? (
                <View style={styles.spotRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={TOKENS.primary} />
                    <View style={styles.spotText}>
                        <Text style={styles.spotAddress} numberOfLines={1}>{timerSpot.address}</Text>
                        {spotMeta(timerSpot) ? (
                            <Text style={styles.spotMeta} numberOfLines={1}>{spotMeta(timerSpot)}</Text>
                        ) : null}
                    </View>
                    <Pressable
                        onPress={onClearSpot}
                        hitSlop={10}
                        style={({ pressed }) => [styles.spotClear, pressed && styles.optionPressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${timerSpot.address}`}
                    >
                        <MaterialCommunityIcons name="close" size={18} color={TOKENS.textMuted} />
                    </Pressable>
                </View>
            ) : suggestedSpot ? (
                <Pressable
                    onPress={() => onUseSpot(suggestedSpot)}
                    style={({ pressed }) => [styles.spotRow, styles.suggestionRow, pressed && styles.optionPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${suggestedSpot.address}${spotMeta(suggestedSpot) ? `, ${spotMeta(suggestedSpot)}` : ''}`}
                >
                    <View style={styles.spotText}>
                        <Text style={styles.suggestionLabel}>Last viewed</Text>
                        <Text style={styles.spotAddress} numberOfLines={1}>{suggestedSpot.address}</Text>
                        {spotMeta(suggestedSpot) ? (
                            <Text style={styles.spotMeta} numberOfLines={1}>{spotMeta(suggestedSpot)}</Text>
                        ) : null}
                    </View>
                    <Text style={styles.suggestionAction}>Use this spot</Text>
                </Pressable>
            ) : (
                <Pressable
                    onPress={onFindSpot}
                    style={({ pressed }) => [styles.spotRow, styles.suggestionRow, pressed && styles.optionPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Choose a spot on the map"
                >
                    <MaterialCommunityIcons name="map-search-outline" size={20} color={TOKENS.primary} />
                    <Text style={[styles.spotText, styles.findSpotText]}>Choose a spot on the map</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.textMuted} />
                </Pressable>
            )}

            {/* How long — options past the spot's posted limit are off. */}
            <Text style={[styles.setupLabel, styles.setupLabelSpaced]}>How long</Text>
            <View style={styles.durationGrid}>
                {DURATION_OPTIONS.map((option) => {
                    const tooLong = maxStay != null && option.value > maxStay;
                    const isActive = selectedDuration === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => setSelectedDuration(option.value)}
                            disabled={tooLong}
                            style={({ pressed }) => [
                                styles.durationOption,
                                isActive && styles.durationOptionActive,
                                tooLong && styles.durationOptionDisabled,
                                pressed && styles.optionPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={tooLong ? `${option.label}, longer than this spot allows` : option.label}
                            accessibilityState={{ selected: isActive, disabled: tooLong }}
                        >
                            <Text
                                style={[
                                    styles.durationTime,
                                    isActive && styles.durationTimeActive,
                                    tooLong && styles.durationTimeDisabled,
                                ]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            {maxStay ? (
                <Text style={styles.limitNote}>{timerSpot.maxStayText} max at this spot</Text>
            ) : null}

            <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ends at</Text>
                    <Text style={styles.summaryValue}>{formatEndTime(endsAt)}</Text>
                </View>
                {cost != null ? (
                    <>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Estimated cost</Text>
                            <Text style={styles.summaryValueLarge}>Up to {formatMoney(cost)}</Text>
                        </View>
                    </>
                ) : null}
            </View>

            <Pressable
                onPress={onStart}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityLabel="Start timer"
            >
                <MaterialCommunityIcons name="timer-play" size={20} color={TOKENS.onPrimary} />
                <Text style={styles.primaryButtonText}>Start timer</Text>
            </Pressable>
        </View>
    );
};

export default SetupCard;
