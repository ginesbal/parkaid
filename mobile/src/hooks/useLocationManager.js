import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_LOCATION, LOCATION_STORAGE_KEY } from '../constants/parking';
import { distanceMeters, isInCalgary } from '../utils/geo';

// Give up on a fix after this long; some phones never answer indoors.
const FIX_TIMEOUT = 10000;
// Opening Home asks again at most this often; pull to refresh always asks.
const REFRESH_EVERY = 60 * 1000;
// A fix older than this is not fresh.
const FIX_MAX_AGE = 10000;
// A fix this close to the one in use keeps it, so GPS jitter does not
// fetch the list again.
const MOVED_ENOUGH = 50; // metres

function withTimeout(promise, ms) {
    let timer;
    const late = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('No location fix in time')), ms);
    });
    return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

async function readSaved() {
    try {
        const saved = JSON.parse(await AsyncStorage.getItem(LOCATION_STORAGE_KEY));
        return Number.isFinite(saved?.latitude) && Number.isFinite(saved?.longitude) ? saved : null;
    } catch (error) {
        return null;
    }
}

/**
 * useLocationManager - where Home searches from. On launch it starts from the
 * last saved fix, so the list appears at once, then asks the phone for a
 * fresh one; again whenever Home opens (refreshLocation()) and on pull to
 * refresh (refreshLocation({ force: true })). It says what it is using:
 *
 * source:     'gps' (a fix from now), 'saved' (an earlier fix, when a fresh
 *             one cannot be had), 'default' (downtown: no permission or no
 *             fix) or 'outside' (downtown: the phone is outside Calgary)
 * savedAt:    when the fix in use was taken (ms), if known
 * permission: 'granted', 'denied' (can still ask) or 'blocked'
 * locating:   a fix is being asked for
 */
export const useLocationManager = () => {
    const [state, setState] = useState({ location: null, source: null, savedAt: null });
    const [permission, setPermission] = useState('granted');
    const [locating, setLocating] = useState(false);

    const current = useRef(state);
    const lastTry = useRef(0);
    const pending = useRef(null);

    const use = useCallback((location, source, savedAt = null) => {
        const next = { location, source, savedAt };
        current.current = next;
        setState(next);
    }, []);

    const refreshLocation = useCallback(({ force = false, ask = false } = {}) => {
        if (pending.current) return pending.current;
        if (!force && Date.now() - lastTry.current < REFRESH_EVERY) return Promise.resolve();
        lastTry.current = Date.now();

        const run = (async () => {
            setLocating(true);
            try {
                let answer = await Location.getForegroundPermissionsAsync();
                if (!answer.granted && ask && answer.canAskAgain) {
                    answer = await Location.requestForegroundPermissionsAsync();
                }
                if (!answer.granted) {
                    setPermission(answer.canAskAgain ? 'denied' : 'blocked');
                    // Without permission an old fix is no better than a guess.
                    use(DEFAULT_LOCATION, 'default');
                    return;
                }
                setPermission('granted');

                const position = await withTimeout(
                    // On web, expo-location reuses any earlier fix unless told
                    // otherwise; phones ignore maximumAge.
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, maximumAge: FIX_MAX_AGE }),
                    FIX_TIMEOUT
                );
                const fix = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                if (!isInCalgary(fix)) {
                    use(DEFAULT_LOCATION, 'outside');
                    return;
                }
                const now = Date.now();
                const { location, source } = current.current;
                const near = location && (source === 'gps' || source === 'saved')
                    && distanceMeters(location, fix) < MOVED_ENOUGH;
                use(near ? location : fix, 'gps', now);
                AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ ...fix, savedAt: now }))
                    .catch((error) => console.warn('Failed to save the location:', error));
            } catch (error) {
                console.warn('No location fix:', error?.message);
                // Keep what is shown; Home says it is a saved place or downtown.
                const { location, source, savedAt } = current.current;
                if (!location) use(DEFAULT_LOCATION, 'default');
                else if (source === 'gps') use(location, 'saved', savedAt);
            } finally {
                setLocating(false);
                pending.current = null;
            }
        })();
        pending.current = run;
        return run;
    }, [use]);

    // Launch: the saved fix at once, then a fresh one, asking for permission
    // the first time.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const saved = await readSaved();
            if (cancelled) return;
            if (saved && !current.current.location) {
                use({ latitude: saved.latitude, longitude: saved.longitude }, 'saved', saved.savedAt ?? null);
            }
            refreshLocation({ force: true, ask: true });
        })();
        return () => {
            cancelled = true;
        };
    }, [use, refreshLocation]);

    // Back in the app (from Settings, or after a drive): look again.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (next) => {
            if (next === 'active') refreshLocation();
        });
        return () => subscription.remove();
    }, [refreshLocation]);

    return {
        location: state.location,
        source: state.source,
        savedAt: state.savedAt,
        permission,
        locating,
        // Nothing to search from yet: only on a first launch, until the
        // first fix or downtown.
        isLoadingLocation: state.location === null,
        refreshLocation,
    };
};
