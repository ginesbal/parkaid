import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenStatusBar from '../../components/ScreenStatusBar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLoader from '../../components/BrandLoader';
import LiveStage from '../../components/LiveStage';
import { PENDING_SPOT_MAX_AGE, STORAGE_KEYS } from '../../constants/session';
import { useSession } from '../../context/SessionContext';
import { useLocationManager } from '../../hooks/useLocationManager';
import { orderPlaces, recallSearch } from '../../services/recentSearch';
import { logger } from '../../utils/loggers';
import { getSpotName } from '../../utils/spotPresentation';
import ActiveSession from './components/ActiveSession';
import EmptyState from './components/EmptyState';
import EndSummary from './components/EmptyState/EndSummary';
import { ELSEWHERE } from './components/EmptyState/SpotPicker';
import { styles } from './SessionScreen.styles';

/**
 * SessionScreen - parking session management. Details hands a spot over as
 * the `spot` route param; it prefills the setup for that spot, and is kept
 * on the phone until its session starts, in case the app is closed first.
 * Without one, the driver picks where they parked from the last search's
 * places nearest the phone, or somewhere else. Nothing is picked for them.
 * The session itself lives in SessionContext, shared with Home and Map.
 */

const rememberPendingSpot = (spot) => {
  const write = spot
    ? AsyncStorage.setItem(STORAGE_KEYS.PENDING_SPOT, JSON.stringify({ spot, savedAt: Date.now() }))
    : AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SPOT);
  write.catch((error) => console.warn('Failed to remember the spot:', error));
};

const recallPendingSpot = async () => {
  try {
    const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SPOT));
    return saved && Date.now() - saved.savedAt < PENDING_SPOT_MAX_AGE ? saved.spot : null;
  } catch (error) {
    return null;
  }
};
export default function SessionScreen({ route, navigation }) {
  const {
    session,
    isLoaded,
    sessionState,
    maxExtendMinutes,
    timeRemaining,
    timeRemainingMs,
    elapsedTime,
    progress,
    startSession,
    endSession,
    finishSession,
    extendSession,
    undoExtend,
    endedSession,
    dismissEnded,
    vehiclePlate,
    setVehiclePlate,
    selectedDuration,
    setSelectedDuration,
    totalCost,
    endTime,
  } = useSession();

  const hasSession = Boolean(session);

  // Spot handed over from Details. Consumed once storage is read, so we know
  // whether a session is already running.
  const routeSpot = route?.params?.spot ?? null;
  const [pendingSpot, setPendingSpot] = React.useState(null);
  const [notice, setNotice] = React.useState(null);

  React.useEffect(() => {
    if (!routeSpot || !isLoaded) return;
    navigation?.setParams({ spot: undefined });
    // A new spot to park at replaces the last session's summary.
    dismissEnded();
    // Keep the new spot either way: if a session is running, it is set up
    // as soon as that session ends, as the notice promises.
    setPendingSpot(routeSpot);
    rememberPendingSpot(routeSpot);
    if (session) {
      setNotice(
        `You\u2019re already parked${session.locationName ? ` at ${session.locationName}` : ''}. End this session to park at ${getSpotName(routeSpot).title}.`
      );
    }
  }, [routeSpot, isLoaded, session, navigation, dismissEnded]);

  // Without a spot from Details, pick up one handed over before the app
  // was closed. Once only, so a started session's spot does not come back.
  const recalled = React.useRef(false);
  React.useEffect(() => {
    if (!isLoaded || routeSpot || recalled.current) return;
    recalled.current = true;
    recallPendingSpot().then((spot) => {
      if (spot) setPendingSpot((current) => current ?? spot);
    });
  }, [isLoaded, routeSpot]);

  // Where the phone is now, to put the places nearest it first. Only a fresh
  // fix: an old one may be from before the drive. Park never asks for
  // permission; Home does.
  const { location, source, refreshLocation } = useLocationManager({ ask: false });
  const here = source === 'gps' ? location : null;

  // Where the car might be: the last search's closest places, read again
  // each time Park opens, since Home or Map may have searched since.
  const [recent, setRecent] = React.useState(null);
  React.useEffect(() => {
    if (hasSession || !navigation) return undefined;
    const recall = () => {
      recallSearch().then(setRecent);
      refreshLocation();
    };
    recall();
    return navigation.addListener('focus', recall);
  }, [hasSession, navigation, refreshLocation]);
  const places = React.useMemo(() => orderPlaces(recent?.spots ?? [], here), [recent, here]);

  // The picked place's id, or ELSEWHERE. Nothing is picked for the driver:
  // a wrong place means paying ParkPlus for the wrong zone. With no places
  // to offer, "Somewhere else" is the only answer.
  const [choice, setChoice] = React.useState(null);
  const [zone, setZone] = React.useState('');
  const picked = places.find((spot) => String(spot.id) === choice) ?? null;
  const elsewhere = choice === ELSEWHERE || places.length === 0;
  const spot = pendingSpot ?? picked;

  const pickAnother = React.useCallback(() => {
    setPendingSpot(null);
    rememberPendingSpot(null);
  }, []);

  // The notice only applies to the session it was about.
  React.useEffect(() => {
    if (!hasSession) setNotice(null);
  }, [hasSession]);

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

  // `duration`: what the setup shows, within the spot's maximum.
  const handleStart = React.useCallback((duration) => {
    logger.log('session_start_request', {
      plate: vehiclePlate || null,
      durationMin: duration,
      spotId: spot?.id ?? null,
      handedOver: Boolean(pendingSpot),
    });
    startSession(spot, { zone: spot ? null : zone || null, duration }).then((started) => {
      if (!started) return;
      setPendingSpot(null);
      rememberPendingSpot(null);
      setChoice(null);
      setZone('');
    });
  }, [vehiclePlate, startSession, spot, pendingSpot, zone]);

  const handleExtend = React.useCallback((minutes) => {
    logger.log('session_extend_request', {
      minutes,
      currentEndTime: endTime,
      elapsedSec: elapsedTime,
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

  // Time is up: end it, and maybe go and look for somewhere else.
  const handleDone = React.useCallback(() => {
    logger.log('session_done', { elapsedSec: elapsedTime });
    finishSession();
  }, [finishSession, elapsedTime]);

  const findParking = React.useCallback(() => {
    logger.log('session_find_parking', { hadSession: hasSession });
    if (hasSession) finishSession();
    dismissEnded();
    navigation?.navigate('Home');
  }, [finishSession, dismissEnded, hasSession, navigation]);

  const prevFormRef = React.useRef({
    plate: vehiclePlate,
    duration: selectedDuration,
  });

  React.useEffect(() => {
    const prev = prevFormRef.current;

    if (vehiclePlate !== prev.plate) {
      logger.log('form_plate_changed', { plateLen: vehiclePlate?.length || 0 });
      prev.plate = vehiclePlate;
    }
    if (selectedDuration !== prev.duration) {
      logger.log('form_duration_changed', { minutes: selectedDuration });
      prev.duration = selectedDuration;
    }
  }, [vehiclePlate, selectedDuration]);

  if (!isLoaded) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        <ScreenStatusBar style="dark" />
        <LiveStage style={styles.loading}>
          <BrandLoader size={88} label="Checking your session" delay={250} live />
        </LiveStage>
      </SafeAreaView>
    );
  }

  if (!hasSession && endedSession && !pendingSpot) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        <ScreenStatusBar style="dark" />
        <EndSummary session={endedSession} onParkAgain={dismissEnded} onFindParking={findParking} />
      </SafeAreaView>
    );
  }

  if (!hasSession) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        <ScreenStatusBar style="dark" />
        <EmptyState
          spot={spot}
          handedOver={Boolean(pendingSpot)}
          places={places}
          searchedAt={recent?.savedAt ?? null}
          nearYou={Boolean(here)}
          choice={picked ? String(picked.id) : elsewhere ? ELSEWHERE : null}
          onChoose={setChoice}
          onPickAnother={pickAnother}
          zone={zone}
          setZone={setZone}
          now={Date.now()}
          vehiclePlate={vehiclePlate}
          setVehiclePlate={setVehiclePlate}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          onStartSession={handleStart}
        />
      </SafeAreaView>
    );
  }

  // A running session is a focus moment: ink canvas, like Details.
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, styles.ink]}>
      <ScreenStatusBar style="light" />
      <ActiveSession
        session={session}
        sessionState={sessionState}
        timeRemainingMs={timeRemainingMs}
        totalCost={totalCost}
        endTime={endTime}
        maxExtendMinutes={maxExtendMinutes}
        notice={notice}
        onExtend={handleExtend}
        onUndo={undoExtend}
        onEnd={handleEnd}
        onDone={handleDone}
        onFindParking={findParking}
      />
    </SafeAreaView>
  );
}
