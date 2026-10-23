import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BrandPin from '../../../../components/BrandPin';
import { chargedCost, parseChargeHours } from '../../../../utils/chargeHours';
import { formatCost } from '../../../../utils/formatters';
import { formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { styles } from './styles';

function Row({ label, value, first = false }) {
    return (
        <>
            {first ? null : <View style={styles.summaryDivider} />}
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
            </View>
        </>
    );
}

/**
 * EndSummary - shown on Park once a session ends: where, the time it covered
 * and what that time costs. Then park again, or find somewhere nearby.
 * `session` is the ended session, with endedAt.
 */
export default function EndSummary({ session, onParkAgain, onFindParking }) {
    const start = new Date(session.startedAt);
    // Ended early, or later than its time: it covered up to whichever came first.
    const end = new Date(Math.min(new Date(session.endedAt).getTime(), new Date(session.scheduledEnd).getTime()));
    const minutes = Math.max(0, Math.round((end - start) / 60000));
    const cost = chargedCost(session.hourlyRate ?? null, parseChargeHours(session.chargeHours), start, minutes);
    const place = [session.locationName, session.locationAddress].filter(Boolean).join(' · ');

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <BrandPin size={64} />
                </View>
                <Text style={styles.title} accessibilityRole="header">Session ended</Text>
                {place ? <Text style={styles.subtitle}>{place}</Text> : null}
            </View>

            <View style={styles.setupCard}>
                <View style={styles.summaryRows}>
                    <Row first label="Timed" value={`${formatClock(start)} to ${formatClock(end)}`} />
                    <Row label="Length" value={formatDuration(minutes)} />
                    {cost !== null ? <Row label={`Cost for ${formatDuration(minutes)}`} value={formatCost(cost)} /> : null}
                </View>

                <TouchableOpacity
                    onPress={onParkAgain}
                    activeOpacity={0.9}
                    style={styles.primaryButton}
                    accessibilityRole="button"
                >
                    <Text style={styles.primaryButtonText}>Park again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onFindParking}
                    activeOpacity={0.85}
                    style={styles.secondaryButton}
                    accessibilityRole="button"
                    accessibilityHint="Opens Home"
                >
                    <Text style={styles.secondaryButtonText}>Find parking nearby</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
