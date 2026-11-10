import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ParkPlusActions from '../../../../components/ParkPlusActions';
import { TOKENS } from '../../../../constants/theme';
import { formatCost } from '../../../../utils/formatters';
import { getEndNote, getSessionZone } from '../../../../utils/parkPlus';
import { sessionCost } from '../../../../utils/rates';
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
 * and what that time costs, and, for a street zone, the MyParking session to
 * end too. Then park again, or find somewhere nearby.
 * `session` is the ended session, with endedAt.
 */
export default function EndSummary({ session, onParkAgain, onFindParking }) {
    const start = new Date(session.startedAt);
    // Ended early, or later than its time: it covered up to whichever came first.
    const end = new Date(Math.min(new Date(session.endedAt).getTime(), new Date(session.scheduledEnd).getTime()));
    const minutes = Math.max(0, Math.round((end - start) / 60000));
    const cost = sessionCost(session, start, minutes);
    const place = [session.locationName, session.locationAddress].filter(Boolean).join(' · ');
    const zone = getSessionZone(session);
    const endNote = getEndNote(session);

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">Session ended</Text>
                {place ? <Text style={styles.subtitle}>{place}</Text> : null}
            </View>

            <View style={styles.setupCard}>
                <View style={styles.summaryRows}>
                    <Row first label="Time" value={`${formatClock(start)} to ${formatClock(end)}`} />
                    <Row label="Length" value={minutes > 0 ? formatDuration(minutes) : 'Under 1 min'} />
                    {cost !== null && minutes > 0 ? (
                        <Row label={`Cost for ${formatDuration(minutes)}`} value={formatCost(cost)} />
                    ) : null}
                </View>

                {endNote ? (
                    <View style={styles.endNote}>
                        <View style={styles.payLine}>
                            <MaterialCommunityIcons name="information-outline" size={18} color={TOKENS.primaryInk} />
                            <Text style={styles.payLineText}>{endNote}</Text>
                        </View>
                        <ParkPlusActions zone={zone} />
                    </View>
                ) : null}

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
