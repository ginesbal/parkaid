import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from '../../constants/session';
import { TOKENS } from '../../constants/theme';
import { useSessionManager } from '../../hooks/useSessionManager';
import TabIcon from '../../navigation/TabIcon';
import { logger } from '../../utils/loggers';
import ActiveSession from './components/ActiveSession';
import EmptyState from './components/EmptyState';
import { styles } from './SessionScreen.styles';

// The Park tab's dot while a timer runs: what it looks like, and what a
// screen reader says about it.
const TIMER_DOT = {
  active: { color: TOKENS.primary, spoken: 'timer running' },
  expiring: { color: TOKENS.warning, spoken: 'timer ends soon' },
  expired: { color: TOKENS.danger, spoken: "time's up" },
};

const sameSpot = (a, b) =>
  Boolean(a && b) && (a.id != null ? a.id === b.id : a.address === b.address);

/**
 * SessionScreen — the Park tab's parking timer.
 */
export default function SessionScreen({ route, navigation }) {
  const {
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
    startSession,
    endSession,
    extendSession,
    undoExtension,
    timerSpot,
    setTimerSpot,
    selectedDuration,
    setSelectedDuration,
  } = useSessionManager();

  const hasSession = Boolean(session);

  // Keep the Park tab's dot in step with the timer, so it's visible from
  // Home and the map. Its label keeps the platform's "tab, 3 of 3" shape.
  React.useEffect(() => {
    if (!navigation?.setOptions) return;
    const dot = hasSession ? TIMER_DOT[sessionState] : null;
    let label;
    if (dot) {
      const state = navigation.getState?.();
      const index = state?.routes?.findIndex((r) => r.key === route?.key) ?? -1;
      label = Platform.OS === 'ios' && index >= 0
        ? `Park, ${dot.spoken}, tab, ${index + 1} of ${state.routes.length}`
        : `Park, ${dot.spoken}`;
    }
    navigation.setOptions({
      tabBarIcon: (props) => <TabIcon route="Park" {...props} dotColor={dot?.color} />,
      tabBarAccessibilityLabel: label,
    });
  }, [navigation, route?.key, hasSession, sessionState]);

  // "Park here" on a spot's card hands that spot over. If a timer is already
  // running, the spot waits — and the running timer offers to switch to it.
  const incomingSpot = route?.params?.spot;
  React.useEffect(() => {
    if (!incomingSpot) return;
    logger.log('park_here_received', { spotId: incomingSpot.id }, 'UI_EVENT');
    setTimerSpot(incomingSpot);
    navigation?.setParams({ spot: undefined });
  }, [incomingSpot, navigation, setTimerSpot]);

  // The last public spot opened on the map, offered as a one-tap
  // suggestion — so nobody has to remember the rate or the time limit.
  const [suggestedSpot, setSuggestedSpot] = React.useState(null);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      AsyncStorage.getItem(STORAGE_KEYS.LAST_SPOT)
        .then((raw) => {
          if (!active) return;
          try {
            setSuggestedSpot(raw ? JSON.parse(raw) : null);
          } catch {
            setSuggestedSpot(null);
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const handleStart = React.useCallback(() => {
    logger.log('timer_start', {
      spotId: timerSpot?.id ?? null,
      durationMin: selectedDuration,
    });
    startSession();
  }, [timerSpot, selectedDuration, startSession]);

  const handleExtend = React.useCallback((minutes) => {
    logger.log('timer_extend', { minutes, currentEndTime: endTime });
    return extendSession(minutes);
  }, [extendSession, endTime]);

  const handleEnd = React.useCallback(() => {
    logger.log('timer_end_request', { elapsedMin: elapsedTime });
    endSession();
  }, [endSession, elapsedTime]);

  const handleFindSpot = React.useCallback(() => {
    navigation?.navigate('Map');
  }, [navigation]);

  // A spot handed over while a timer runs (and still running — once time's
  // up, "Start a new timer" already leads to it).
  const pendingSpot = hasSession && sessionState !== 'expired' && timerSpot && !sameSpot(timerSpot, session.spot)
    ? timerSpot
    : null;

  // The prompt already says the current timer ends, so no second confirm.
  const handleSwitchSpot = React.useCallback(() => {
    logger.log('timer_switch_spot', { from: session?.spot?.id ?? null, to: timerSpot?.id ?? null }, 'UI_EVENT');
    endSession({ confirm: false });
  }, [endSession, session, timerSpot]);

  const handleKeepTimer = React.useCallback(() => {
    setTimerSpot(session?.spot ?? null);
  }, [session, setTimerSpot]);

  // No 'bottom' edge: the tab bar already sits on the home indicator, and
  // bottom tabs hands screens the raw insets — adding it again leaves a gap.
  if (!hasSession) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <StatusBar style="dark" />
        <EmptyState
          timerSpot={timerSpot}
          // Don't suggest the spot that's already chosen.
          suggestedSpot={suggestedSpot && suggestedSpot.id !== timerSpot?.id ? suggestedSpot : null}
          onUseSpot={setTimerSpot}
          onClearSpot={() => setTimerSpot(null)}
          onFindSpot={handleFindSpot}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          onStart={handleStart}
          reminderStatus={reminderStatus}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar style="dark" />
      <ActiveSession
        session={session}
        sessionState={sessionState}
        timeRemainingMs={timeRemainingMs}
        elapsedTime={elapsedTime}
        estimatedCost={estimatedCost}
        endTime={endTime}
        remainingAllowance={remainingAllowance}
        canExtendBy={canExtendBy}
        lastExtension={lastExtension}
        reminderStatus={reminderStatus}
        pendingSpot={pendingSpot}
        onSwitchSpot={handleSwitchSpot}
        onKeepTimer={handleKeepTimer}
        onExtend={handleExtend}
        onUndoExtend={undoExtension}
        onEnd={handleEnd}
      />
    </SafeAreaView>
  );
}
