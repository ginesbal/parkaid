import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { MOTION, TOKENS } from '../../../../constants/theme';
import { formatMoney } from '../../../../utils/formatters';
import { formatClock, formatDuration, formatRemaining } from '../../../../utils/sessionHelpers';
import StatusBadge from '../shared/StatusBadge';
import { styles } from './styles';

const NATIVE = Platform.OS !== 'web';

function Row({ label, value }) {
    return (
        <View style={styles.kv}>
            <Text style={styles.kvLabel}>{label}</Text>
            <Text style={styles.kvValue}>{value}</Text>
        </View>
    );
}

/**
 * TimerCard - the white card on the ink canvas: time left as people say it,
 * when it ends, where, and a plain-text warning when it is time to head back.
 */
export default function TimerCard({ session, sessionState, timeRemainingMs, endTime, totalCost }) {
    const total = Math.max(1, (session?.duration || 1) * 60000);
    const left = Math.max(0, Math.min(1, timeRemainingMs / total));

    // Time-left bar, scaled from the left on the native driver.
    const bar = useRef(new Animated.Value(left)).current;
    useEffect(() => {
        Animated.timing(bar, {
            toValue: left,
            duration: MOTION.duration.base,
            easing: MOTION.easing,
            useNativeDriver: NATIVE,
        }).start();
    }, [left, bar]);

    const expired = sessionState === 'expired';
    const expiring = sessionState === 'expiring';
    const walk = session?.walkMinutes;
    const remaining = formatRemaining(timeRemainingMs);
    const endsAt = formatClock(endTime);

    let warning = null;
    if (expired) {
        warning = 'Your time is up. Move your car to avoid a ticket.';
    } else if (expiring) {
        warning = walk
            ? `Time to head back. It’s about a ${walk} minute walk to your car.`
            : 'Time to head back to your car.';
    }

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <StatusBadge state={sessionState} />
                <Text style={styles.demo}>Demo</Text>
            </View>

            <Text style={styles.timeLabel}>{expired ? 'Session ended' : 'Time left'}</Text>
            <Text
                style={[styles.time, expiring && styles.timeWarning, expired && styles.timeDanger]}
                accessibilityLabel={expired ? 'Time is up' : `${remaining} left, ends at ${endsAt}`}
            >
                {remaining}
            </Text>

            <View
                style={styles.track}
                accessibilityRole="progressbar"
                accessibilityLabel="Time left"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(left * 100) }}
            >
                <Animated.View
                    style={[
                        styles.fill,
                        expiring && styles.fillWarning,
                        expired && styles.fillDanger,
                        { transform: [{ scaleX: bar }] },
                    ]}
                />
            </View>
            <Text style={styles.endsAt}>{expired ? `Ended at ${endsAt}` : `Ends at ${endsAt}`}</Text>

            {warning ? (
                <View style={[styles.warning, expired && styles.warningDanger]} accessibilityRole="alert">
                    <MaterialCommunityIcons
                        name={expired ? 'alert-circle-outline' : 'walk'}
                        size={18}
                        color={expired ? TOKENS.danger : TOKENS.warningInk}
                    />
                    <Text style={[styles.warningText, expired && styles.warningTextDanger]}>{warning}</Text>
                </View>
            ) : null}

            <View style={styles.place}>
                <Text style={styles.placeName}>{session.locationName}</Text>
                <Text style={styles.placeDetail}>
                    {[session.locationAddress, session.spotId].filter(Boolean).join(' · ')}
                </Text>
            </View>

            <Row label="Vehicle" value={session.vehiclePlate} />
            <Row label="Started" value={formatClock(session.startedAt)} />
            <Row
                label="Rate"
                value={session.hourlyRate === null
                    ? (session.rateNote || 'Posted at the spot')
                    : `${formatMoney(session.hourlyRate)} / hour`}
            />
            {totalCost !== null ? (
                <Row label={`Total for ${formatDuration(session.duration)}`} value={formatMoney(totalCost)} />
            ) : null}
        </View>
    );
}
