import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { WARNING_LEAD_MINUTES } from '../../../../services/timerReminders';
import { formatEndTime } from '../../../../utils/formatters';
import ReminderNote from '../shared/ReminderNote';
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
    reminderStatus,
    onExtend,
    onUndoExtend,
    onEnd,
}) => {
    const isExpired = sessionState === 'expired';

    // Reassurance at the anxious moment: when the reminder will come. More
    // than ten minutes left means the heads-up is still ahead.
    let reminderLine = null;
    if (reminderStatus === 'granted' && !isExpired && endTime) {
        reminderLine = sessionState === 'active'
            ? `You'll get a reminder at ${formatEndTime(new Date(endTime.getTime() - WARNING_LEAD_MINUTES * 60000))}, ${WARNING_LEAD_MINUTES} minutes before it ends.`
            : "You'll get a reminder when time's up.";
    }
    const footnote = [reminderLine, "This timer doesn't pay for parking."].filter(Boolean).join(' ');

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

                {reminderStatus === 'denied' && !isExpired ? (
                    <View style={styles.reminderNoteWrap}>
                        <ReminderNote text="Notifications are off, so you won't be reminded when the app is closed." />
                    </View>
                ) : null}

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

                <Text style={styles.footnote}>{footnote}</Text>
            </ScrollView>
        </>
    );
};

export default ActiveSession;
