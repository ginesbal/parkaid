import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// Places picked from search, newest first. Kept only on this phone. Three
// fit in the search panel without scrolling.
export const RECENT_PLACES_KEY = 'recent_places_v1';
export const MAX_RECENT_PLACES = 3;

const isPlace = (p) => Boolean(p) && typeof p.lat === 'number' && typeof p.lng === 'number';

// The same place can come back with or without an id; fall back to where it is.
const samePlace = (a, b) => (
    a.place_id && b.place_id
        ? a.place_id === b.place_id
        : a.lat.toFixed(5) === b.lat.toFixed(5) && a.lng.toFixed(5) === b.lng.toFixed(5)
);

// Newest first, no repeats, at most MAX_RECENT_PLACES.
const merge = (newer, older) => newer
    .concat(older.filter((o) => !newer.some((n) => samePlace(n, o))))
    .slice(0, MAX_RECENT_PLACES);

export function useRecentPlaces() {
    const [recentPlaces, setRecentPlaces] = useState([]);
    // Mirrors state, so remembering reads the latest list without waiting
    // for a render, and storage writes stay out of state updaters.
    const listRef = useRef([]);

    const save = useCallback((next) => {
        listRef.current = next;
        setRecentPlaces(next);
        AsyncStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(next)).catch(() => {});
    }, []);

    useEffect(() => {
        let active = true;
        AsyncStorage.getItem(RECENT_PLACES_KEY)
            .then((raw) => {
                const parsed = raw ? JSON.parse(raw) : [];
                const stored = Array.isArray(parsed) ? parsed.filter(isPlace) : [];
                if (!active) return;
                // A place picked before storage answered still goes first.
                if (listRef.current.length) {
                    save(merge(listRef.current, stored));
                } else {
                    listRef.current = stored.slice(0, MAX_RECENT_PLACES);
                    setRecentPlaces(listRef.current);
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [save]);

    const rememberPlace = useCallback((place) => {
        if (!isPlace(place)) return;
        const entry = {
            place_id: place.place_id,
            name: place.name || '',
            address: place.address || '',
            lat: place.lat,
            lng: place.lng,
        };
        save(merge([entry], listRef.current));
    }, [save]);

    const clearRecentPlaces = useCallback(() => {
        listRef.current = [];
        setRecentPlaces([]);
        AsyncStorage.removeItem(RECENT_PLACES_KEY).catch(() => {});
    }, []);

    return { recentPlaces, rememberPlace, clearRecentPlaces };
}
