import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { WALK_MINUTES } from '../constants/parking';

// How far the user will walk, in minutes: one choice shared by Home and the
// map (set it on one, the other follows), remembered between visits.

const STORAGE_KEY = 'walkMinutes';
const listeners = new Set();
let current = WALK_MINUTES.default;
let loaded = false;

const isValid = (n) => Number.isInteger(n) && n >= WALK_MINUTES.min && n <= WALK_MINUTES.max;

function publish(minutes) {
    current = minutes;
    listeners.forEach((listener) => listener(minutes));
}

export function setWalkMinutes(minutes) {
    if (!isValid(minutes) || minutes === current) return;
    publish(minutes);
    AsyncStorage.setItem(STORAGE_KEY, String(minutes)).catch(() => {});
}

export function useWalkMinutes() {
    const [minutes, setMinutes] = useState(current);

    useEffect(() => {
        listeners.add(setMinutes);
        setMinutes(current);
        if (!loaded) {
            loaded = true;
            AsyncStorage.getItem(STORAGE_KEY)
                .then((saved) => {
                    const n = Number(saved);
                    if (saved != null && isValid(n) && n !== current) publish(n);
                })
                .catch(() => {});
        }
        return () => listeners.delete(setMinutes);
    }, []);

    return [minutes, setWalkMinutes];
}

// Tests only: forget the shared value between test cases.
export function resetWalkMinutesForTests() {
    current = WALK_MINUTES.default;
    loaded = false;
    listeners.clear();
}
