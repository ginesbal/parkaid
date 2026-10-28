import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import ParkPlusActions from '../../../../components/ParkPlusActions';
import { MOTION, TOKENS } from '../../../../constants/theme';
import { formatCost, formatMoney } from '../../../../utils/formatters';
import { getExpiredLine, getSessionPayLine, getSessionZone } from '../../../../utils/parkPlus';
import { sessionRateAt } from '../../../../utils/rates';
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
 * TimerCard - the first white card on the ink canvas: time left as people say
 * it, when it ends, and a plain-text warning when it is time to head back.
 * Once time is up it says so once, calmly, with the one thing to do. Add and
 * End come right under it, so they are in reach on the smallest phones;
 * SessionDetails below says where, and how to pay.
 */
export default function TimerCard({ session, sessionState, timeRemainingMs, endTime }) {
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
    const zone = getSessionZone(session);

    const warning = walk
        // A no-break space keeps the number with its unit when the line wraps.
        ? `Time to head back. It’s about a ${walk}\u00A0minute walk to your car.`
        : 'Time to head back to your car.';

    return (
        <View style={styles.card}>
            {expired ? (
                <>
                    <Text style={styles.expiredTitle}>Time’s up</Text>
                    <Text style={styles.endsAt}>Ended at {endsAt}</Text>
                    <Text style={styles.pay}>{getExpiredLine(session)}</Text>
                    {zone ? <ParkPlusActions zone={zone} style={styles.payActions} /> : null}
                </>
            ) : (
                <>
                    <View style={styles.cardTop}>
                        <StatusBadge state={sessionState} />
                    </View>

                    <Text style={styles.timeLabel}>Time left</Text>
                    {/* "2 hours 59 min" is wide: on a narrow phone it shrinks to
                        stay on one line. (Web cannot shrink text, so it wraps.) */}
                    <Text
                        style={[styles.time, expiring && styles.timeWarning]}
                        numberOfLines={NATIVE ? 1 : 0}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        accessibilityLabel={`${remaining} left, ends at ${endsAt}`}
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
                            style={[styles.fill, expiring && styles.fillWarning, { transform: [{ scaleX: bar }] }]}
                        />
                    </View>
                    <Text style={styles.endsAt}>Ends at {endsAt}</Text>

                    {expiring ? (
                        <View style={styles.warning} accessibilityRole="alert">
                            <MaterialCommunityIcons name="walk" size={18} color={TOKENS.warningInk} />
                            <Text style={styles.warningText}>{warning}</Text>
                        </View>
                    ) : null}
                </>
            )}
        </View>
    );
}

/**
 * SessionDetails - the second card: where, that the timer pays for nothing
 * (with the hand-off to ParkPlus), and the session's plate, start, rate now
 * and cost. Once time is up, TimerCard says what to do instead.
 */
export function SessionDetails({ session, sessionState, totalCost }) {
    const expired = sessionState === 'expired';
    // The rate right now: it can change during the session, and goes on
    // after it in MyParking. The cost below covers the session's own time.
    const rate = sessionRateAt(session, Date.now());
    const zone = getSessionZone(session);
    // "Somewhere else" with a zone is named after it; say it once.
    const placeDetail = [session.locationAddress, session.spotId]
        .filter((part) => part && part !== session.locationName)
        .join(' · ');

    return (
        <View style={styles.card}>
            <View style={styles.place}>
                {session.locationName ? <Text style={styles.placeName}>{session.locationName}</Text> : null}
                {placeDetail ? <Text style={styles.placeDetail}>{placeDetail}</Text> : null}
                {expired ? null : (
                    <>
                        <Text style={styles.pay}>{getSessionPayLine(session)}</Text>
                        {zone ? <ParkPlusActions zone={zone} style={styles.payActions} /> : null}
                    </>
                )}
            </View>

            <Row label="Vehicle" value={session.vehiclePlate} />
            <Row label="Started" value={formatClock(session.startedAt)} />
            <Row
                label="Rate now"
                value={rate === null
                    ? (session.rateNote || 'Posted at the spot')
                    : rate === 0 ? 'Free' : `${formatMoney(rate)} / hour`}
            />
            {totalCost !== null ? (
                <Row label={`Cost for ${formatDuration(session.duration)}`} value={formatCost(totalCost)} />
            ) : null}
        </View>
    );
}
