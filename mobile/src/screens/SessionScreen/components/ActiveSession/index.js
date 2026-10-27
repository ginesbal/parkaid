import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXTEND_STEP } from '../../../../constants/session';
import { useEntrance } from '../../../../hooks/useEntrance';
import { chargedCost, parseChargeHours } from '../../../../utils/chargeHours';
import { formatMoney } from '../../../../utils/formatters';
import { getSessionZone } from '../../../../utils/parkPlus';
import { formatClock, formatDuration } from '../../../../utils/sessionHelpers';
import { formatMaxStay } from '../../../../utils/spotPresentation';
import { styles } from './styles';
import TimerCard from './TimerCard';

// How long Undo stays after Extend.
const UNDO_FOR = 5000;

/**
 * ActiveSession - the running session on the ink canvas. One clear way to add
 * time (with the new end time, what it adds in ParkPlus, and a short undo,
 * capped at the spot's maximum stay), and End kept apart. Once time is up:
 * Done, or find somewhere else to park.
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
    onUndo,
    onEnd,
    onDone,
    onFindParking,
}) => {
    const insets = useSafeAreaInsets();
    // Card, then actions: a quiet "you're parked" moment when a session starts.
    const [cardIn, actionsIn] = useEntrance(2);
    const expired = sessionState === 'expired';
    const zone = getSessionZone(session);

    // null max means no posted limit; otherwise extend by what is left of it.
    const step = maxExtendMinutes === null ? EXTEND_STEP : Math.min(EXTEND_STEP, maxExtendMinutes);
    const atMax = maxExtendMinutes !== null && maxExtendMinutes <= 0;
    const newEnd = endTime ? new Date(endTime.getTime() + step * 60000) : null;
    // What the added time costs, charged minutes only; no price when the rate
    // is unknown, never a made-up one.
    const extendCost = chargedCost(session.hourlyRate ?? null, parseChargeHours(session.chargeHours), endTime, step);
    let extendNote = null;
    if (extendCost === 0) extendNote = 'Free at that time';
    else if (extendCost !== null) extendNote = `${formatMoney(extendCost)} more${zone ? ' in ParkPlus' : ''}`;

    // The last Extend, while it can still be undone.
    const [added, setAdded] = useState(null);
    const undoTimer = useRef(null);
    useEffect(() => () => clearTimeout(undoTimer.current), []);
    const hideUndoLater = () => {
        clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setAdded(null), UNDO_FOR);
    };

    const extend = async () => {
        onExtend(step);
        setAdded({ minutes: step, until: newEnd });
        clearTimeout(undoTimer.current);
        // With a screen reader, Undo stays until it is used or time is added
        // again, so there is time to reach it. (Web cannot tell, and always
        // says yes; there Undo stays while it has keyboard focus.)
        const reader = Platform.OS !== 'web'
            && await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
        if (!reader) hideUndoLater();
    };

    const undo = () => {
        clearTimeout(undoTimer.current);
        setAdded(null);
        onUndo();
    };

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
                {expired ? (
                    <>
                        <TouchableOpacity
                            onPress={onDone}
                            activeOpacity={0.9}
                            style={styles.done}
                            accessibilityRole="button"
                            accessibilityHint="Ends the session"
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onFindParking}
                            activeOpacity={0.85}
                            style={[styles.end, styles.findParking]}
                            accessibilityRole="button"
                            accessibilityHint="Ends the session and opens Home"
                        >
                            <Text style={styles.endText}>Find parking nearby</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {!atMax ? (
                            <TouchableOpacity
                                onPress={extend}
                                activeOpacity={0.9}
                                style={styles.extend}
                                accessibilityRole="button"
                                accessibilityLabel={`Add ${formatDuration(step)}, until ${formatClock(newEnd)}${extendNote ? `. ${extendNote}` : ''}`}
                            >
                                <Text style={styles.extendText}>
                                    Add {formatDuration(step)} · until {formatClock(newEnd)}
                                </Text>
                                {extendNote ? <Text style={styles.extendNote}>{extendNote}</Text> : null}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.capped} accessibilityRole="text">
                                <Text style={styles.cappedTitle}>
                                    {formatMaxStay(session.maxDuration)} reached
                                </Text>
                                <Text style={styles.cappedBody}>Move your car by {formatClock(endTime)}.</Text>
                            </View>
                        )}

                        {added ? (
                            <View style={styles.undo}>
                                <View style={styles.undoText}>
                                    <Text style={styles.undoTitle}>
                                        Added {formatDuration(added.minutes)}. Ends at {formatClock(added.until)}.
                                    </Text>
                                    <Text style={styles.undoBody}>
                                        {zone ? 'Add the same time in ParkPlus.' : 'Add the same time where you paid.'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={undo}
                                    onFocus={() => clearTimeout(undoTimer.current)}
                                    onBlur={hideUndoLater}
                                    style={styles.undoButton}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Undo adding ${formatDuration(added.minutes)}`}
                                >
                                    <Text style={styles.undoButtonText}>Undo</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            onPress={onEnd}
                            activeOpacity={0.85}
                            style={styles.end}
                            accessibilityRole="button"
                            accessibilityHint="Asks before ending"
                        >
                            <Text style={styles.endText}>End session</Text>
                        </TouchableOpacity>
                    </>
                )}
            </Animated.View>
        </ScrollView>
    );
};

export default ActiveSession;
