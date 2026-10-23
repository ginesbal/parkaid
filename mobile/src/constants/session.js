

export const STORAGE_KEYS = {
    SESSION: 'parking_session_v2',
    USER_PREFERENCES: 'user_preferences',
    HISTORY: 'session_history',
    LAST_PLATE: 'parkaid.lastPlate',
    // The spot handed over from Details, until its session starts.
    PENDING_SPOT: 'parkaid.pendingSpot',
    // The closest places from the last search (see services/recentSearch).
    RECENT_SEARCH: 'parkaid.recentSearch',
};

// How long a handed-over spot is kept if its session never starts.
export const PENDING_SPOT_MAX_AGE = 12 * 60 * 60 * 1000;
// How long the last search is offered as where the car might be.
export const RECENT_SEARCH_MAX_AGE = 3 * 60 * 60 * 1000;

export const DEFAULT_VALUES = {
    DURATION: 60, // minutes
    LOCATION: 'Downtown Calgary',
    MAX_PLATE_LENGTH: 10,
};

export const DURATION_OPTIONS = [
    { value: 30, label: '30 minutes', quickSelect: true },
    { value: 60, label: '1 hour', quickSelect: true },
    { value: 120, label: '2 hours', quickSelect: true },
    { value: 180, label: '3 hours', quickSelect: true },
    { value: 240, label: '4 hours', quickSelect: false },
    { value: 480, label: '8 hours', quickSelect: false },
];

export const EXTENSION_OPTIONS = [
    { minutes: 15, label: '+15min', highlight: false },
    { minutes: 30, label: '+30min', highlight: false },
    { minutes: 60, label: '+1hr', highlight: true },
    { minutes: 120, label: '+2hr', highlight: false },
];

export const SESSION_STATES = {
    ACTIVE: 'active',
    EXPIRING: 'expiring',
    EXPIRED: 'expired',
};

// Minutes of buffer, on top of the walk back, before we say "head back".
export const HEAD_BACK_BUFFER = 10;
// Default walk when a session has no spot ("Somewhere else").
export const DEFAULT_WALK_MINUTES = 5;
// The one-tap extension on the active session.
export const EXTEND_STEP = 30;

export const ALERTS = {
    EXPIRING_THRESHOLD: 10, // minutes
    URGENT_THRESHOLD: 5, // minutes
    UPDATE_INTERVAL: 30000, // milliseconds (30 seconds)
};

export const VALIDATION = {
    PLATE: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 10,
        PATTERN: /^[A-Z0-9\s-]+$/i,
        ERROR_MESSAGES: {
            REQUIRED: 'License plate is required',
            TOO_SHORT: 'License plate must be at least 2 characters',
            TOO_LONG: 'License plate must be 10 characters or less',
            INVALID: 'License plate can only contain letters, numbers, spaces, and hyphens',
        },
    },
};

export const UI_CONFIG = {
    ANIMATION: {
        PULSE_DURATION: 1000,
        TRANSITION_DURATION: 300,
    },
    REFRESH_RATE: 30000, // 30 seconds
    SHOW_TIPS: true,
    ENABLE_NOTIFICATIONS: true,
};