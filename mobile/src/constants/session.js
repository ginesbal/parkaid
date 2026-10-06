// Parking timer.
//
// parkaid can't pay for parking — in Calgary that's tied to your licence
// plate through the City's system — so the Park tab is an honest reminder
// timer: it keeps time for a spot you chose, inside that spot's posted limit.
// It deliberately doesn't ask for a plate, which would imply you'd paid.

export const STORAGE_KEYS = {
    // v3: the timer shape (an optional spot summary). The old demo session —
    // plate, hand-picked rate, a made-up meter — lived under an older key and
    // is ignored.
    SESSION: 'parking_timer_v3',
    // The last public spot opened on the map, offered as "Use this spot".
    LAST_SPOT: 'last_viewed_spot',
};

export const DEFAULT_DURATION = 60; // minutes

export const DURATION_OPTIONS = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
];

export const EXTENSION_OPTIONS = [
    { minutes: 15, label: '+15 min' },
    { minutes: 30, label: '+30 min' },
    { minutes: 60, label: '+1 hour' },
];

// How long "Undo" stays available after adding time.
export const UNDO_WINDOW_MS = 15000;
