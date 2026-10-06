import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated } from 'react-native';
import { DEFAULT_VALUES, STORAGE_KEYS } from '../constants/session.js';
import { formatEndTime, formatTime } from '../utils/formatters';
import { calculateProgress, calculateSessionState } from '../utils/sessionHelpers';

export const useSessionManager = () => {
    // core state
    const [session, setSession] = useState(null);
    const [now, setNow] = useState(Date.now()); // ms

    // form state for new sessions
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [selectedRate, setSelectedRate] = useState(DEFAULT_VALUES.RATE);
    const [selectedDuration, setSelectedDuration] = useState(DEFAULT_VALUES.DURATION);

    // animation values
    const pulseAnim = useState(new Animated.Value(1))[0];

    // load session from storage on mount
    const loadSession = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
            const parsed = raw ? JSON.parse(raw) : null;
            setSession(parsed);
        } catch (error) {
            console.error('Failed to load session:', error);
            setSession(null);
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
        const totalMin = session.duration || 60;
        const hours = totalMin / 60;
        return Number((hours * session.hourlyRate).toFixed(2));
    }, [session]);

    const progress = useMemo(
        () => calculateProgress(elapsedTime, session?.duration),
        [elapsedTime, session]
    );

    const sessionState = useMemo(
        () => calculateSessionState(timeRemaining),
        [timeRemaining]
    );

    // handle expiring animation
    useEffect(() => {
        if (sessionState === 'expiring') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [sessionState, pulseAnim]);

    // action handlers
    const startSession = useCallback(async () => {
        if (!vehiclePlate.trim()) {
            Alert.alert(
                'License Plate Required',
                'Please enter your vehicle license plate to continue.'
            );
            return;
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + selectedDuration * 60000);

        const newSession = {
            id: `session_${Date.now()}`,
            locationName: 'Downtown Calgary',
            locationAddress: '4th Avenue SW',
            spotId: 'Meter 217',
            hourlyRate: selectedRate,
            duration: selectedDuration, // minutes
            startedAt: startTime.toISOString(),
            scheduledEnd: endTime.toISOString(),
            vehiclePlate: vehiclePlate.trim().toUpperCase(),
            totalCost: (selectedDuration / 60) * selectedRate,
        };

        await saveSession(newSession);
        setVehiclePlate('');
    }, [vehiclePlate, selectedRate, selectedDuration, saveSession]);

    const extendSession = useCallback(async (additionalMinutes) => {
        // Guard the date math: a missing or non-numeric amount would build an
        // Invalid Date and throw from toISOString().
        if (!session || !Number.isFinite(additionalMinutes) || additionalMinutes <= 0) return;

        const currentEnd = new Date(session.scheduledEnd);
        const newEnd = new Date(currentEnd.getTime() + additionalMinutes * 60000);
        const newDuration = session.duration + additionalMinutes;
        const additionalCost = (additionalMinutes / 60) * session.hourlyRate;

        const updatedSession = {
            ...session,
            scheduledEnd: newEnd.toISOString(),
            duration: newDuration,
            totalCost: session.totalCost + additionalCost,
        };

        await saveSession(updatedSession);

        Alert.alert(
            'Time Extended! ✓',
            `Added ${formatTime(additionalMinutes)}\nNew end time: ${formatEndTime(newEnd)}`,
            [{ text: 'Got it', style: 'default' }]
        );
    }, [session, saveSession]);

    const endSession = useCallback(() => {
        if (!session) return;

        Alert.alert(
            'End Parking Session?',
            timeRemaining > 0
                ? `You still have ${formatTime(timeRemaining)} remaining.\nAre you sure you want to end now?`
                : 'Are you sure you want to end this session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Session',
                    style: 'destructive',
                    onPress: async () => {
                        await saveSession(null);
                    },
                },
            ]
        );
    }, [session, timeRemaining, saveSession]);

    return {
        // session data
        session,
        sessionState,
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

        pulseAnim,
    };
};
