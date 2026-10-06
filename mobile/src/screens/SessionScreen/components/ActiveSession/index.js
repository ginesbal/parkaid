import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBadge from '../shared/StatusBadge';
import QuickExtend from './QuickExtend';
import SessionDetails from './SessionDetails';
import { styles } from './styles';
import TimerCard from './TimerCard';
import { TOKENS } from '../../../../constants/theme';

/**
 * ActiveSession - Displays and manages an active parking session
 */
const ActiveSession = ({
    session,
    sessionState,
    timeRemaining,
    elapsedTime,
    progress,
    totalCost,
    endTime,
    onExtend,
    onEnd,
}) => {
    const sessionLabel = [session?.spotId, session?.locationName].filter(Boolean).join(' • ');

    return (
        <>
            <View style={styles.header}>
                <View style={styles.statusBar}>
                    <StatusBadge state={sessionState} />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {sessionLabel}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <TimerCard
                    sessionState={sessionState}
                    timeRemaining={timeRemaining}
                    progress={progress}
                    endTime={endTime}
                    totalCost={totalCost}
                />

                <QuickExtend
                    onExtend={onExtend}
                    hourlyRate={session.hourlyRate}
                    disabled={sessionState === 'expired'}
                />

                <SessionDetails
                    session={session}
                    elapsedTime={elapsedTime}
                />
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.bottomActions}>
                <TouchableOpacity
                    onPress={onEnd}
                    activeOpacity={0.9}
                    style={styles.endButton}
                    accessibilityRole="button"
                    accessibilityLabel="End parking session"
                    accessibilityHint="Stops your current parking session"
                >
                    <MaterialCommunityIcons
                        name="stop-circle"
                        size={20}
                        color={TOKENS.onPrimary}
                    />
                    <Text style={styles.endButtonText}>End session</Text>
                </TouchableOpacity>
                <Text style={styles.bottomHint}>
                    Ending early will stop the demo timer immediately.
                </Text>
            </SafeAreaView>
        </>
    );
};

export default ActiveSession;
