import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { DEFAULT_VALUES, DEFAULT_WALK_MINUTES, HEAD_BACK_BUFFER, STORAGE_KEYS } from '../constants/session.js';
import { cancelSessionReminders, scheduleSessionReminders } from '../services/reminders';
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

export const useSessionManager = () => {
    // core state
    const [session, setSession] = useState(null);
    // false until storage has been read, so the screen does not flash the setup form
    const [isLoaded, setIsLoaded] = useState(false);
    const [now, setNow] = useState(Date.now()); // ms

    // form state for new sessions
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [selectedRate, setSelectedRate] = useState(DEFAULT_VALUES.RATE);
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

    const totalCost = useMemo(() => {
        if (!session) return 0;
        // Spots without a known rate (lots, unpriced blocks) have no total.
        if (session.hourlyRate === null) return null;
        const totalMin = session.duration || 60;
        const hours = totalMin / 60;
        return Number((hours * session.hourlyRate).toFixed(2));
    }, [session]);

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
    // `spot` is the spot handed over from Details; without one this is the demo flow.
    const startSession = useCallback(async (spot = null) => {
        if (!vehiclePlate.trim()) {
            Alert.alert(
                'License Plate Required',
                'Please enter your vehicle license plate to continue.'
            );
            return false;
        }

        const plate = vehiclePlate.trim().toUpperCase();
        const spotRate = spot ? getHourlyRate(spot) : null;
        // A real spot uses its own rate, or none when the data has none; only
        // the demo flow uses the picked rate.
        const hourlyRate = spot ? spotRate : selectedRate;
        const maxDuration = spot ? getMaxStayMinutes(spot) : null;
        const duration = maxDuration ? Math.min(selectedDuration, maxDuration) : selectedDuration;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const name = spot ? getSpotName(spot) : null;

        const newSession = {
            id: `session_${Date.now()}`,
            locationName: name?.title || 'Downtown Calgary',
            locationAddress: spot ? (name.detail || getSpotKind(spot)) : '4th Avenue SW',
            spotId: spot ? (getZoneLabel(spot) || getSpotKind(spot)) : 'Meter 217',
            parkingSpotId: spot?.id ?? null,
            hourlyRate,
            duration, // minutes
            maxDuration, // minutes, from the spot's posted maximum
            walkMinutes: Number.isFinite(Number(spot?.walkingTime)) ? Number(spot.walkingTime) : null,
            startedAt: startTime.toISOString(),
            scheduledEnd: endTime.toISOString(),
            vehiclePlate: plate,
            totalCost: hourlyRate === null ? null : (duration / 60) * hourlyRate,
            rateNote: spot && hourlyRate === null ? getRateDisplay(spot).note : null,
        };

        await saveSession(newSession);
        // The first Start is when we ask to send reminders; the setup card
        // says why just above the button.
        scheduleSessionReminders(newSession, warnMinutesFor(newSession), { ask: true });
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_PLATE, plate);
        } catch (error) {
            console.warn('Failed to remember plate:', error);
        }
        return true;
    }, [vehiclePlate, selectedRate, selectedDuration, saveSession]);

    const extendSession = useCallback(async (additionalMinutes) => {
        if (!session) return;

        const currentEnd = new Date(session.scheduledEnd);
        const newEnd = new Date(currentEnd.getTime() + additionalMinutes * 60000);
        const newDuration = session.duration + additionalMinutes;
        const updatedSession = {
            ...session,
            scheduledEnd: newEnd.toISOString(),
            duration: newDuration,
            totalCost: session.hourlyRate === null
                ? null
                : session.totalCost + (additionalMinutes / 60) * session.hourlyRate,
        };

        await saveSession(updatedSession);
        scheduleSessionReminders(updatedSession, warnMinutesFor(updatedSession));

        // The card updates in place; tell screen readers what changed.
        AccessibilityInfo.announceForAccessibility?.(
            `Added ${formatDuration(additionalMinutes)}. Now ends at ${formatClock(newEnd)}.`
        );
    }, [session, saveSession]);

    const endSession = useCallback(() => {
        if (!session) return;

        confirm({
            title: 'End this session?',
            message: timeRemaining > 0
                ? `You still have ${formatDuration(timeRemaining)} left.`
                : undefined,
            confirmText: 'End session',
            destructive: true,
            onConfirm: () => {
                cancelSessionReminders();
                saveSession(null);
            },
        });
    }, [session, timeRemaining, saveSession]);

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

        // actions
        startSession,
        endSession,
        extendSession,

        // form state
        vehiclePlate,
        setVehiclePlate,
        selectedRate,
        setSelectedRate,
        selectedDuration,
        setSelectedDuration,
    };
};
