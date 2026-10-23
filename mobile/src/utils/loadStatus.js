// How a failed or older load reads on screen, so Home and Map say it the
// same way: once, in plain words, never as a raw "HTTP 500". `kind` comes
// from services/api (ApiError): 'offline', 'timeout' or 'server'.

import { formatClock } from './sessionHelpers';

const LOAD_ERRORS = {
    offline: {
        icon: 'wifi-off',
        title: 'No connection',
        body: 'Check that you’re online, then try again.',
        short: 'Offline',
    },
    timeout: {
        icon: 'timer-sand',
        title: 'Parking data is slow to answer',
        body: 'It didn’t answer in time. Try again in a moment.',
        short: 'No answer',
    },
    server: {
        icon: 'cloud-off-outline',
        title: 'Parking data isn’t available',
        body: 'The parking service had a problem. Try again in a moment.',
        short: 'Can’t update',
    },
};

// { icon, title, body, short } for a failure kind; anything unknown reads
// as the service's problem.
export function getLoadError(kind) {
    return LOAD_ERRORS[kind] || LOAD_ERRORS.server;
}

// Data younger than this needs no date.
const FRESH_FOR = 5 * 60 * 1000;

// A short note on how old the shown list is:
//   "Updating…", "Saved 2:10 PM · Updating…", "Offline · saved 2:10 PM",
//   "Saved 2:10 PM", or null when it is fresh and settled.
export function describeSaved({ savedAt, stale = null, updating = false, now = Date.now() }) {
    const old = Boolean(savedAt) && (stale || now - savedAt > FRESH_FOR);
    if (updating) return old ? `Saved ${formatClock(savedAt)} · Updating…` : 'Updating…';
    if (!old) return null;
    return stale
        ? `${getLoadError(stale).short} · saved ${formatClock(savedAt)}`
        : `Saved ${formatClock(savedAt)}`;
}
