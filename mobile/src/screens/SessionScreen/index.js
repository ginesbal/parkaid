import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionManager } from '../../hooks/useSessionManager';
import { logger } from '../../utils/loggers';
import ActiveSession from './components/ActiveSession';
import EmptyState from './components/EmptyState';
import { styles } from './SessionScreen.styles';

/**
 * SessionScreen - parking session management
 */
export default function SessionScreen() {
  const {
    session,
    sessionState,
    timeRemaining,
    elapsedTime,
    progress,
    startSession,
    endSession,
    extendSession,
    vehiclePlate,
    setVehiclePlate,
    selectedRate,
    setSelectedRate,
    selectedDuration,
    setSelectedDuration,
    totalCost,
    endTime,
  } = useSessionManager();

  const hasSession = Boolean(session);

  React.useEffect(() => {
    logger.log('session_screen_mount');
  }, []);

  React.useEffect(() => {
    logger.log('session_state_update', {
      hasSession,
      state: sessionState || 'idle',
      totalCost,
      endTime,
    });
  }, [endTime, hasSession, sessionState, totalCost]);

  React.useEffect(() => {
    if (hasSession) {
      logger.log('session_view_active', {
        timeRemainingSec: timeRemaining,
        progress,
      });
      return;
    }

    logger.log('session_view_empty');
  }, [hasSession, progress, timeRemaining]);

  const handleStart = React.useCallback(() => {
    logger.log('session_start_request', {
      plate: vehiclePlate || null,
      rate: selectedRate,
      durationMin: selectedDuration,
    });
    startSession();
  }, [vehiclePlate, selectedRate, selectedDuration, startSession]);

  // QuickExtend passes the minutes the user picked. Dropping that argument
  // used to make every "Add time" a silent no-op (extendSession(undefined)
  // threw a RangeError building the new end time).
  const handleExtend = React.useCallback((minutes) => {
    logger.log('session_extend_request', {
      minutes,
      currentEndTime: endTime,
      elapsedMin: elapsedTime,
    });
    extendSession(minutes);
  }, [extendSession, endTime, elapsedTime]);

  const handleEnd = React.useCallback(() => {
    logger.log('session_end_request', {
      elapsedSec: elapsedTime,
      totalCost,
    });
    endSession();
  }, [endSession, elapsedTime, totalCost]);

  const prevFormRef = React.useRef({
    plate: vehiclePlate,
    rate: selectedRate,
    duration: selectedDuration,
  });

  React.useEffect(() => {
    const prev = prevFormRef.current;

    if (vehiclePlate !== prev.plate) {
      logger.log('form_plate_changed', { plateLen: vehiclePlate?.length || 0 });
      prev.plate = vehiclePlate;
    }
    if (selectedRate !== prev.rate) {
      logger.log('form_rate_changed', { rate: selectedRate });
      prev.rate = selectedRate;
    }
    if (selectedDuration !== prev.duration) {
      logger.log('form_duration_changed', { minutes: selectedDuration });
      prev.duration = selectedDuration;
    }
  }, [vehiclePlate, selectedRate, selectedDuration]);

  if (!hasSession) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        <StatusBar style="dark" />
        <EmptyState
          vehiclePlate={vehiclePlate}
          setVehiclePlate={setVehiclePlate}
          selectedRate={selectedRate}
          setSelectedRate={setSelectedRate}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          onStartSession={handleStart}
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
        timeRemaining={timeRemaining}
        elapsedTime={elapsedTime}
        progress={progress}
        totalCost={totalCost}
        endTime={endTime}
        onExtend={handleExtend}
        onEnd={handleEnd}
      />
    </SafeAreaView>
  );
}
