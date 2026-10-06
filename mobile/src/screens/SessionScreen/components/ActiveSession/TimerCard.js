import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';
import { formatEndTime, formatMoney } from '../../../../utils/formatters';
import { formatDuration } from '../../../../utils/spotInfo';
import { styles } from './styles';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// 01:05:09 — seconds round up, so it reads 00:00:00 exactly when time is up.
const toHMS = (ms) => {
    const totalSeconds = Math.max(0, Math.ceil((ms ?? 0) / 1000));
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    return [hh, mm, ss].map((n) => String(n).padStart(2, '0')).join(':');
};

/**
 * TimerCard — the countdown. The hook ticks every second, so this only
 * renders what it's given.
 */
export default function TimerCard({
    sessionState,
    timeRemainingMs,
    plannedMinutes,
    endTime,
    estimatedCost,
}) {
    const reducedMotion = useReducedMotion();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // A slow pulse in the last ten minutes. With Reduce Motion the card stays
    // still; the amber already carries the warning.
    useEffect(() => {
        if (sessionState !== 'expiring' || reducedMotion) {
            pulseAnim.setValue(1);
            return undefined;
        }
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.02, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [sessionState, reducedMotion, pulseAnim]);

    const isExpired = sessionState === 'expired';
    const remainingMs = Math.max(0, timeRemainingMs ?? 0);
    const totalMs = (plannedMinutes || 0) * 60000;
    const remainingRatio = totalMs > 0 ? clamp01(remainingMs / totalMs) : 0;

    const cardStyles = [styles.timerCard];
    const valueStyles = [styles.timerValue];
    const progressStyles = [styles.progressBar];
    if (sessionState === 'expiring') {
        cardStyles.push(styles.timerCardWarning);
        valueStyles.push(styles.timerValueWarning);
        progressStyles.push(styles.progressBarWarning);
    } else if (isExpired) {
        cardStyles.push(styles.timerCardDanger);
        valueStyles.push(styles.timerValueDanger);
        progressStyles.push(styles.progressBarDanger);
    }

    const endText = `${isExpired ? 'Ended' : 'Ends'} at ${formatEndTime(endTime)}`;
    const costText = estimatedCost != null ? `Up to ${formatMoney(estimatedCost)}` : null;

    // "42 minutes left. Ends at 3:45 PM." — not "zero zero colon forty two".
    const spokenSummary = [
        isExpired ? "Time's up." : `${formatDuration(Math.ceil(remainingMs / 60000))} left.`,
        `${endText}.`,
        costText ? `Estimated cost ${costText.toLowerCase()}.` : null,
    ].filter(Boolean).join(' ');

    return (
        <Animated.View
            style={[...cardStyles, { transform: [{ scale: pulseAnim }] }]}
            accessible
            accessibilityLabel={spokenSummary}
        >
            <Text style={styles.timerLabel}>
                {isExpired ? "Time's up" : 'Time remaining'}
            </Text>

            <Text style={valueStyles}>{toHMS(remainingMs)}</Text>

            <View style={styles.progressContainer}>
                <View style={[...progressStyles, { width: `${remainingRatio * 100}%` }]} />
            </View>

            <View style={styles.timerMeta}>
                <View style={styles.timerMetaItem}>
                    <MaterialCommunityIcons name="timer-sand" size={14} color={TOKENS.textMuted} />
                    <Text style={styles.timerMetaText}>{endText}</Text>
                </View>
                {costText ? (
                    <View style={styles.timerMetaItem}>
                        <MaterialCommunityIcons name="cash" size={14} color={TOKENS.textMuted} />
                        <Text style={styles.timerMetaText}>{costText}</Text>
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}
