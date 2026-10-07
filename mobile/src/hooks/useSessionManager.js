import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import {
    DEFAULT_DURATION,
    DURATION_OPTIONS,
    STORAGE_KEYS,
    UNDO_WINDOW_MS,
} from '../constants/session.js';
import {
    cancelTimerReminders,
    getReminderStatus,
    scheduleTimerReminders,
} from '../services/timerReminders';
import { calculateCost, calculateSessionState } from '../utils/sessionHelpers';
import { formatDuration } from '../utils/spotInfo';

// The longest preset that fits within a spot's posted limit, preferring the
// duration the user already picked. A limit shorter than every preset is
// used as-is (e.g. a 15-minute loading zone).
export const fitDurationToLimit = (maxStayMinutes, preferred = DEFAULT_DURATION) => {
    if (!maxStayMinutes || preferred <= maxStayMinutes) return preferred;
    const fitting = DURATION_OPTIONS.filter((option) => option.value <= maxStayMinutes);
    return fitting.length ? fitting[fitting.length - 1].value : maxStayMinutes;
};

/**
 * The Park tab's parking timer. A reminder, not a payment: it keeps time for
 * an optional spot, and never plans past that spot's posted limit.
 */
export const useSessionManager = () => {
    // core state
    const [session, setSession] = useState(null);
    const [now, setNow] = useState(Date.now()); // ms

    // setup for the next timer
    const [timerSpot, setTimerSpotState] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);

    // The most recent "Add time", kept briefly so it can be undone in place.
    const [lastExtension, setLastExtension] = useState(null);

    // Whether reminders can reach the user: 'granted' | 'denied' |
    // 'undetermined' (not asked yet) | 'unsupported' (web) — null until known.
    // Mirrored in a ref so saving a timer can read it without re-creating
    // every action that saves.
    const [reminderStatus, setReminderStatusState] = useState(null);
    const reminderStatusRef = useRef(null);
    const setReminderStatus = useCallback((status) => {
        reminderStatusRef.current = status;
        setReminderStatusState(status);
    }, []);
    const sessionRef = useRef(null);

    // load the running timer from storage on mount
    const loadSession = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
            const stored = raw ? JSON.parse(raw) : null;
            sessionRef.current = stored;
            setSession(stored);
            setNow(Date.now());
            return stored;
        } catch (error) {
            console.error('Failed to load timer:', error);
            setSession(null);
            return null;
        }
    }, []);

    // The single place a timer is saved — so it's also the single place its
    // reminders follow along: rescheduled when the timer changes (start, Add
    // time, Undo), cancelled when it ends.
    const saveSession = useCallback(async (sessionData) => {
        try {
            sessionRef.current = sessionData || null;
            if (!sessionData) {
                await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
                setSession(null);
                cancelTimerReminders();
                return;
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
            setSession(sessionData);
            // `now` only ticks once a second; without this a fresh 1-hour
            // timer reads 01:00:01 (and "1 hour 1 minute") until the next tick.
            setNow(Date.now());
            if (reminderStatusRef.current === 'granted') scheduleTimerReminders(sessionData);
        } catch (error) {
            console.error('Failed to save timer:', error);
        }
    }, []);

    // On launch: restore the timer, check (never ask) whether reminders are
    // allowed, and re-sync them — so the phone's schedule matches the timer.
    useEffect(() => {
        let active = true;
        (async () => {
            const stored = await loadSession();
            const status = await getReminderStatus();
            if (!active) return;
            setReminderStatus(status);
            if (status === 'granted' && stored) scheduleTimerReminders(stored);
        })();
        return () => {
            active = false;
        };
    }, [loadSession, setReminderStatus]);

    // Back from Settings with notifications newly turned on (or off): pick it
    // up, and schedule the running timer's reminders if they're now allowed.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (state) => {
            if (state !== 'active') return;
            const status = await getReminderStatus();
            if (status === reminderStatusRef.current) return;
            setReminderStatus(status);
            if (status === 'granted' && sessionRef.current) scheduleTimerReminders(sessionRef.current);
        });
        return () => subscription?.remove?.();
    }, [setReminderStatus]);

    // tick every second
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // The undo offer is short-lived, like a toast.
    useEffect(() => {
        if (!lastExtension) return undefined;
        const timer = setTimeout(() => setLastExtension(null), UNDO_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [lastExtension]);

    // Choosing a spot keeps the planned duration inside its posted limit.
    const setTimerSpot = useCallback((spot) => {
        setTimerSpotState(spot || null);
        if (spot?.maxStayMinutes) {
            setSelectedDuration((current) => fitDurationToLimit(spot.maxStayMinutes, current));
        }
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

    const elapsedMs = useMemo(
        () => (startTime ? Math.max(0, now - startTime.getTime()) : 0),
        [now, startTime]
    );

    const timeRemainingMs = useMemo(
        () => (endTime ? Math.max(0, endTime.getTime() - now) : 0),
        [now, endTime]
    );

    // Minute granularity. Remaining time rounds up, like any countdown: 59
    // seconds left is "1 minute", and the timer only reads zero when it is.
    const elapsedTime = useMemo(() => Math.floor(elapsedMs / 60000), [elapsedMs]);
    const timeRemaining = useMemo(() => Math.ceil(timeRemainingMs / 60000), [timeRemainingMs]);

    const sessionState = useMemo(
        () => calculateSessionState(timeRemaining),
        [timeRemaining]
    );

    // Only known when the timer is for a spot with a real hourly rate. It's
    // an upper bound — the spot may be free for part of the time.
    const estimatedCost = useMemo(() => {
        const rate = session?.spot?.hourlyRate;
        return rate ? calculateCost(session.duration, rate) : null;
    }, [session]);

    // Minutes still allowed under the spot's posted limit (null = no limit).
    const remainingAllowance = session?.spot?.maxStayMinutes
        ? Math.max(0, session.spot.maxStayMinutes - session.duration)
        : null;

    const canExtendBy = useCallback(
        (minutes) => remainingAllowance == null || minutes <= remainingAllowance,
        [remainingAllowance]
    );

    // actions
    const startSession = useCallback(async () => {
        const minutes = selectedDuration;
        if (!Number.isFinite(minutes) || minutes <= 0) return;

        const start = new Date();
        const end = new Date(start.getTime() + minutes * 60000);
        const started = {
            id: `timer_${start.getTime()}`,
            startedAt: start.toISOString(),
            scheduledEnd: end.toISOString(),
            duration: minutes, // planned minutes from the start; grows with "Add time"
            spot: timerSpot,
        };

        await saveSession(started);
        setLastExtension(null);

        // Ask for notifications here, once the timer is already running —
        // the moment the reason is obvious. Declining never stops the timer.
        if (reminderStatusRef.current !== 'granted') {
            const status = await getReminderStatus({ ask: true });
            setReminderStatus(status);
            if (status === 'granted' && sessionRef.current?.id === started.id) {
                scheduleTimerReminders(started);
            }
        }
    }, [selectedDuration, timerSpot, saveSession, setReminderStatus]);

    // Adds time immediately and offers an inline undo — no confirm dialog.
    // Returns null when the amount is invalid or would pass the spot's limit.
    const extendSession = useCallback(async (additionalMinutes) => {
        // Guard the date math: a missing or non-numeric amount would build an
        // Invalid Date and throw from toISOString().
        if (!session || !Number.isFinite(additionalMinutes) || additionalMinutes <= 0) return null;

        // Never plan past the posted limit — that's how tickets happen.
        const maxStay = session.spot?.maxStayMinutes;
        if (maxStay && session.duration + additionalMinutes > maxStay) return null;

        const newEnd = new Date(new Date(session.scheduledEnd).getTime() + additionalMinutes * 60000);
        const updated = {
            ...session,
            scheduledEnd: newEnd.toISOString(),
            duration: session.duration + additionalMinutes,
        };

        await saveSession(updated);
        setLastExtension({
            previous: session,
            minutes: additionalMinutes,
            newEnd: updated.scheduledEnd,
        });
        return { minutes: additionalMinutes, newEnd };
    }, [session, saveSession]);

    const undoExtension = useCallback(async () => {
        if (!lastExtension) return;
        await saveSession(lastExtension.previous);
        setLastExtension(null);
    }, [lastExtension, saveSession]);

    // `confirm: false` is for when the choice was already explicit — e.g.
    // "Switch" to a new spot, whose prompt says the current timer ends.
    const endSession = useCallback(({ confirm = true } = {}) => {
        if (!session) return;

        // Once time is up there's nothing to lose — no confirm.
        if (!confirm || timeRemaining <= 0) {
            saveSession(null);
            setLastExtension(null);
            return;
        }

        Alert.alert(
            'End this timer?',
            `You still have ${formatDuration(timeRemaining)} left.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End timer',
                    style: 'destructive',
                    onPress: async () => {
                        await saveSession(null);
                        setLastExtension(null);
                    },
                },
            ]
        );
    }, [session, timeRemaining, saveSession]);

    return {
        // running timer
        session,
        sessionState,
        timeRemaining,      // minutes
        timeRemainingMs,    // ms
        elapsedTime,        // minutes
        elapsedMs,          // ms
        estimatedCost,
        startTime,
        endTime,
        remainingAllowance, // minutes still allowed by the spot's limit, or null
        canExtendBy,
        lastExtension,
        reminderStatus,

        // actions
        startSession,
        endSession,
        extendSession,
        undoExtension,

        // setup for the next timer
        timerSpot,
        setTimerSpot,
        selectedDuration,
        setSelectedDuration,
    };
};
