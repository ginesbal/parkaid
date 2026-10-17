import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXTEND_STEP } from '../../../../constants/session';
import { useEntrance } from '../../../../hooks/useEntrance';
import { formatMoney } from '../../../../utils/formatters';
import { calculateCost, formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { styles } from './styles';
import TimerCard from './TimerCard';

/**
 * ActiveSession - the running session on the ink canvas. One clear way to add
 * time (priced, and capped at the spot's maximum stay), and End kept apart.
 */
const ActiveSession = ({
    session,
    sessionState,
    timeRemainingMs,
    totalCost,
    endTime,
    maxExtendMinutes,
    notice,
    onExtend,
    onEnd,
}) => {
    const insets = useSafeAreaInsets();
    // Card, then actions: a quiet "you're parked" moment when a session starts.
    const [cardIn, actionsIn] = useEntrance(2);
    const expired = sessionState === 'expired';

    // null max means no posted limit; otherwise extend by what is left of it.
    const step = maxExtendMinutes === null ? EXTEND_STEP : Math.min(EXTEND_STEP, maxExtendMinutes);
    const atMax = maxExtendMinutes !== null && maxExtendMinutes <= 0;
    const extendCost = formatMoney(calculateCost(step, session.hourlyRate));

    return (
        <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.screenTitle} accessibilityRole="header">Parking session</Text>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <Animated.View style={cardIn}>
                <TimerCard
                    session={session}
                    sessionState={sessionState}
                    timeRemainingMs={timeRemainingMs}
                    endTime={endTime}
                    totalCost={totalCost}
                />
            </Animated.View>

            <Animated.View style={[styles.actions, actionsIn]}>
                {!expired && !atMax ? (
                    <TouchableOpacity
                        onPress={() => onExtend(step)}
                        activeOpacity={0.9}
                        style={styles.extend}
                        accessibilityRole="button"
                        accessibilityLabel={`Extend ${formatDuration(step)} for ${extendCost}`}
                    >
                        <Text style={styles.extendText}>
                            Extend {formatDuration(step)} {'·'} {extendCost}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {atMax && !expired ? (
                    <View style={styles.capped} accessibilityRole="text">
                        <Text style={styles.cappedTitle}>
                            {formatDuration(session.maxDuration)} maximum reached
                        </Text>
                        <Text style={styles.cappedBody}>Move your car by {formatClock(endTime)}.</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    onPress={onEnd}
                    activeOpacity={0.85}
                    style={[styles.end, expired && styles.endPrimary]}
                    accessibilityRole="button"
                    accessibilityHint="Asks before ending"
                >
                    <Text style={[styles.endText, expired && styles.endTextPrimary]}>End session</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
};

export default ActiveSession;
