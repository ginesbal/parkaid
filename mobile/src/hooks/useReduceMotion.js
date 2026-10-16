import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// One app-wide subscription shared by every caller. (On web, separate
// listeners for the same handler key can remove each other.)
let current = null;
let started = false;
const listeners = new Set();

function set(value) {
    if (current === value) return;
    current = value;
    listeners.forEach((listener) => listener());
}

function start() {
    if (started) return;
    started = true;
    AccessibilityInfo.isReduceMotionEnabled()
        .then((value) => set(Boolean(value)))
        .catch(() => set(false));
    AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => set(Boolean(value)));
}

function subscribe(listener) {
    start();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const getSnapshot = () => current;

// null until the OS answers, then true/false. Follows the setting live.
export function useReduceMotion() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
