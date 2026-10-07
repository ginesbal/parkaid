import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from '../../constants/session';
import { useSessionManager } from '../../hooks/useSessionManager';
import { logger } from '../../utils/loggers';
import ActiveSession from './components/ActiveSession';
import EmptyState from './components/EmptyState';
import { styles } from './SessionScreen.styles';

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

  // "Park here" on a spot's card hands that spot over. If a timer is already
  // running, the spot waits in setup for when it ends.
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
        onExtend={handleExtend}
        onUndoExtend={undoExtension}
        onEnd={handleEnd}
      />
    </SafeAreaView>
  );
}
