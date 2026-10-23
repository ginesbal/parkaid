import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, AppState } from 'react-native';
import { DEFAULT_VALUES, DEFAULT_WALK_MINUTES, HEAD_BACK_BUFFER, STORAGE_KEYS } from '../constants/session.js';
import { cancelSessionReminders, scheduleSessionReminders } from '../services/reminders';
import { chargedCost, parseChargeHours } from '../utils/chargeHours';
import { confirm } from '../utils/confirm';
import {
    calculateProgress,
    calculateSessionState,
    formatClock,
    formatDuration,
    getWarnAtMinutes,
} from '../utils/sessionHelpers';
import {
    getHourlyRate,
    getMaxStayMinutes,
    getRateDisplay,
    getSpotKind,
    getSpotName,
    getZoneLabel,
} from '../utils/spotPresentation';

// "Head back" starts when the walk back plus a buffer is all that is left,
// scaled down for short sessions.
const warnMinutesFor = (session) => getWarnAtMinutes(
    session?.walkMinutes ?? DEFAULT_WALK_MINUTES,
    session?.duration,
    HEAD_BACK_BUFFER
);

// What the session's time costs in ParkPlus: charged minutes only, null when
// the rate is unknown. Sessions saved before charging hours were kept count
// every minute.
const sessionCost = (session) => chargedCost(
    session.hourlyRate ?? null,
    parseChargeHours(session.chargeHours),
    session.startedAt,
    session.duration
);

export const useSessionManager = () => {
    // core state
    const [session, setSession] = useState(null);
    // false until storage has been read, so the screen does not flash the setup form
    const [isLoaded, setIsLoaded] = useState(false);
    const [now, setNow] = useState(Date.now()); // ms
    // The session that just ended, for a short summary on Park.
    const [endedSession, setEndedSession] = useState(null);
    // The session before the last Extend, for its undo.
    const undoRef = useRef(null);

    // form state for new sessions
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [selectedDuration, setSelectedDuration] = useState(DEFAULT_VALUES.DURATION);


    // load session from storage on mount
    const loadSession = useCallback(async () => {
        try {
            const [raw, lastPlate] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.SESSION),
                AsyncStorage.getItem(STORAGE_KEYS.LAST_PLATE),
            ]);
            const parsed = raw ? JSON.parse(raw) : null;
            setSession(parsed);
            // Keep the phone's reminders in step with the stored session,
            // without asking for permission here.
            if (parsed) scheduleSessionReminders(parsed, warnMinutesFor(parsed));
            // Prefill the plate from last time; the driver can still change it.
            if (lastPlate) setVehiclePlate((current) => current || lastPlate);
        } catch (error) {
            console.error('Failed to load session:', error);
            setSession(null);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // save session to storage
    const saveSession = useCallback(async (sessionData) => {
        try {
            if (!sessionData) {
                await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
                setSession(null);
                return;
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
            setSession(sessionData);
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }, []);

    // initialize on mount
    useEffect(() => {
        loadSession();
    }, [loadSession]);

    // Back in the app: reschedule, so reminders the driver has just allowed
    // in Settings start working, and any already shown are cleared.
    useEffect(() => {
        if (!session) return undefined;
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') scheduleSessionReminders(session, warnMinutesFor(session));
        });
        return () => subscription.remove();
    }, [session]);

    // update timer every 1 second
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // derived timestamps
    const startTime = useMemo(
        () => (session ? new Date(session.startedAt) : null),
        [session]
    );

    const endTime = useMemo(
        () => (session?.scheduledEnd ? new Date(session.scheduledEnd) : null),
        [session]
    );

    // millisecond precision
    const elapsedMs = useMemo(
        () => (startTime ? Math.max(0, now - startTime.getTime()) : 0),
        [now, startTime]
    );

    const timeRemainingMs = useMemo(() => {
        if (!endTime) return 0;
        return Math.max(0, endTime.getTime() - now);
    }, [now, endTime]);

    // minute granularity (for helpers that expect minutes)
    const elapsedTime = useMemo(
        () => Math.floor(elapsedMs / 60000),
        [elapsedMs]
    );

    const timeRemaining = useMemo(
        () => Math.floor(timeRemainingMs / 60000),
        [timeRemainingMs]
    );

    // Spots without a known rate (lots, unpriced blocks) have no total.
    const totalCost = useMemo(() => (session ? sessionCost(session) : 0), [session]);

    const progress = useMemo(
        () => calculateProgress(elapsedTime, session?.duration),
        [elapsedTime, session]
    );

    const warnAtMinutes = warnMinutesFor(session);

    // Rounded up, so the last seconds still count as time left, not expired.
    const sessionState = useMemo(
        () => calculateSessionState(Math.ceil(timeRemainingMs / 60000), warnAtMinutes),
        [timeRemainingMs, warnAtMinutes]
    );

    // How much more the spot's maximum stay allows; null when it has none.
    const maxExtendMinutes = useMemo(() => {
        if (!session?.maxDuration) return null;
        return Math.max(0, session.maxDuration - session.duration);
    }, [session]);


    // action handlers
    // `spot`: the place picked on Park or handed over from Details. Without
    // one the driver is "somewhere else", with the zone from the sign if
    // they gave it, and no rate: ParkAid never makes one up.
    // `duration`: the minutes shown on the setup, else the stored pick.
    const startSession = useCallback(async (spot = null, { zone = null, duration: minutes = selectedDuration } = {}) => {
        if (!vehiclePlate.trim()) {
            Alert.alert(
                'Add your license plate',
                'Enter your plate to start the session.'
            );
            return false;
        }

        const plate = vehiclePlate.trim().toUpperCase();
        const hourlyRate = spot ? getHourlyRate(spot) : null;
        const maxDuration = spot ? getMaxStayMinutes(spot) : null;
        const duration = maxDuration ? Math.min(minutes, maxDuration) : minutes;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const name = spot ? getSpotName(spot) : null;
        const zoneLabel = zone ? `Zone ${zone}` : null;

        const newSession = {
            id: `session_${Date.now()}`,
            locationName: spot ? name.title : zoneLabel,
            locationAddress: spot ? (name.detail || getSpotKind(spot)) : null,
            // The ParkPlus zone ("Zone 1684"), or a lot's kind (see utils/parkPlus).
            spotId: spot ? (getZoneLabel(spot) || getSpotKind(spot)) : zoneLabel,
            parkingSpotId: spot?.id ?? null,
            hourlyRate,
            duration, // minutes
            maxDuration, // minutes, from the spot's posted maximum
            walkMinutes: Number.isFinite(Number(spot?.walkingTime)) ? Number(spot.walkingTime) : null,
            startedAt: startTime.toISOString(),
            scheduledEnd: endTime.toISOString(),
            vehiclePlate: plate,
            rateNote: hourlyRate === null ? getRateDisplay(spot).note : null,
            // When the City charges here ("0910-1750 MON-SAT"); null for lots.
            chargeHours: spot?.zone_info?.enforceable_time ?? null,
        };
        newSession.totalCost = sessionCost(newSession);

        await saveSession(newSession);
        setEndedSession(null);
        undoRef.current = null;
        // The first Start is when we ask to send reminders; the setup card
        // says why just above the button.
        scheduleSessionReminders(newSession, warnMinutesFor(newSession), { ask: true });
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_PLATE, plate);
        } catch (error) {
            console.warn('Failed to remember plate:', error);
        }
        return true;
    }, [vehiclePlate, selectedDuration, saveSession]);

    const extendSession = useCallback(async (additionalMinutes) => {
        if (!session) return;

        const currentEnd = new Date(session.scheduledEnd);
        const newEnd = new Date(currentEnd.getTime() + additionalMinutes * 60000);
        const newDuration = session.duration + additionalMinutes;
        const updatedSession = {
            ...session,
            scheduledEnd: newEnd.toISOString(),
            duration: newDuration,
        };
        updatedSession.totalCost = sessionCost(updatedSession);

        undoRef.current = session;
        await saveSession(updatedSession);
        scheduleSessionReminders(updatedSession, warnMinutesFor(updatedSession));

        // The card updates in place; tell screen readers what changed.
        AccessibilityInfo.announceForAccessibility?.(
            `Added ${formatDuration(additionalMinutes)}. Now ends at ${formatClock(newEnd)}.`
        );
    }, [session, saveSession]);

    // Takes back the last Extend, while the session it extended still runs.
    const undoExtend = useCallback(async () => {
        const previous = undoRef.current;
        undoRef.current = null;
        if (!previous || previous.id !== session?.id) return;
        await saveSession(previous);
        scheduleSessionReminders(previous, warnMinutesFor(previous));
        AccessibilityInfo.announceForAccessibility?.(
            `Undone. Ends at ${formatClock(previous.scheduledEnd)}.`
        );
    }, [session, saveSession]);

    const dismissEnded = useCallback(() => setEndedSession(null), []);

    // Ends at once: for a session whose time is already up.
    const finishSession = useCallback(() => {
        if (!session) return;
        cancelSessionReminders();
        undoRef.current = null;
        setEndedSession({ ...session, endedAt: new Date().toISOString() });
        saveSession(null);
        AccessibilityInfo.announceForAccessibility?.('Session ended.');
    }, [session, saveSession]);

    // Asks first while there is time left.
    const endSession = useCallback(() => {
        if (!session) return;
        if (timeRemaining <= 0) {
            finishSession();
            return;
        }
        confirm({
            title: 'End this session?',
            message: `You still have ${formatDuration(timeRemaining)} left.`,
            confirmText: 'End session',
            destructive: true,
            onConfirm: finishSession,
        });
    }, [session, timeRemaining, finishSession]);

    return {
        // session data
        session,
        isLoaded,
        sessionState,
        warnAtMinutes,
        maxExtendMinutes,
        timeRemaining,      // minutes
        timeRemainingMs,    // ms
        elapsedTime,        // minutes
        elapsedMs,          // ms
        progress,
        totalCost,
        startTime,
        endTime,

        endedSession,       // the session just ended, with endedAt

        // actions
        startSession,
        endSession,
        finishSession,
        extendSession,
        undoExtend,
        dismissEnded,

        // form state
        vehiclePlate,
        setVehiclePlate,
        selectedDuration,
        setSelectedDuration,
    };
};
