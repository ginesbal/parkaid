import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import StatusBadge from '../shared/StatusBadge';
import QuickExtend from './QuickExtend';
import SessionDetails from './SessionDetails';
import { styles } from './styles';
import TimerCard from './TimerCard';

const STATE_ANNOUNCEMENTS = {
    expiring: 'Your parking timer ends in 10 minutes.',
    expired: "Time's up on your parking timer.",
};

/**
 * ActiveSession — a running parking timer.
 */
const ActiveSession = ({
    session,
    sessionState,
    timeRemainingMs,
    elapsedTime,
    estimatedCost,
    endTime,
    remainingAllowance,
    canExtendBy,
    lastExtension,
    onExtend,
    onUndoExtend,
    onEnd,
}) => {
    const isExpired = sessionState === 'expired';

    // Say it when the timer crosses into its last ten minutes, or runs out,
    // while this screen is open. (Android reads the live region below.)
    const prevStateRef = useRef(sessionState);
    useEffect(() => {
        const prev = prevStateRef.current;
        prevStateRef.current = sessionState;
        if (prev === sessionState || Platform.OS !== 'ios') return;
        const message = STATE_ANNOUNCEMENTS[sessionState];
        if (message) AccessibilityInfo.announceForAccessibility(message);
    }, [sessionState]);

    return (
        <>
            <View style={styles.header}>
                <StatusBadge state={sessionState} />
                <Text style={styles.headerSpot} numberOfLines={1}>
                    {session.spot?.address || 'Parking timer'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <TimerCard
                    sessionState={sessionState}
                    timeRemainingMs={timeRemainingMs}
                    plannedMinutes={session.duration}
                    endTime={endTime}
                    estimatedCost={estimatedCost}
                />

                {isExpired ? (
                    <View style={styles.expiredSection} accessibilityLiveRegion="polite">
                        <Text style={styles.expiredText}>
                            Move your car or pay for more time, then start a new timer.
                        </Text>
                        <Pressable
                            onPress={onEnd}
                            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Start a new timer"
                        >
                            <MaterialCommunityIcons name="timer-refresh" size={20} color={TOKENS.onPrimary} />
                            <Text style={styles.primaryButtonText}>Start a new timer</Text>
                        </Pressable>
                    </View>
                ) : (
                    <QuickExtend
                        onExtend={onExtend}
                        onUndo={onUndoExtend}
                        canExtendBy={canExtendBy}
                        lastExtension={lastExtension}
                        maxStayText={session.spot?.maxStayText}
                        remainingAllowance={remainingAllowance}
                    />
                )}

                <SessionDetails session={session} elapsedTime={elapsedTime} />

                {!isExpired ? (
                    <Pressable
                        onPress={onEnd}
                        style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="End timer"
                    >
                        <Text style={styles.endButtonText}>End timer</Text>
                    </Pressable>
                ) : null}

                <Text style={styles.footnote}>
                    A reminder only — this doesn't pay for parking.
                </Text>
            </ScrollView>
        </>
    );
};

export default ActiveSession;
