

export const STORAGE_KEYS = {
    SESSION: 'parking_session_v2',
    USER_PREFERENCES: 'user_preferences',
    HISTORY: 'session_history',
    LAST_PLATE: 'parkaid.lastPlate',
};

export const DEFAULT_VALUES = {
    RATE: 2.5,
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

export const RATE_OPTIONS = [
    { value: 1.5, label: '$1.50/hr', tier: 'economy' },
    { value: 2.5, label: '$2.50/hr', tier: 'standard' },
    { value: 3.5, label: '$3.50/hr', tier: 'premium' },
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
// Default walk when a session has no spot (the demo flow).
export const DEFAULT_WALK_MINUTES = 5;
// The one-tap extension on the active session.
export const EXTEND_STEP = 30;

export const ALERTS = {
    EXPIRING_THRESHOLD: 10, // minutes
    URGENT_THRESHOLD: 5, // minutes
    UPDATE_INTERVAL: 30000, // milliseconds (30 seconds)
};

export const DEMO_LOCATIONS = [
    {
        id: 'meter_217',
        name: 'Downtown Calgary',
        address: '4th Avenue SW',
        spotId: 'Meter 217',
        coordinates: { lat: 51.0447, lng: -114.0719 },
    },
    {
        id: 'meter_318',
        name: 'Kensington',
        address: 'Kensington Road NW',
        spotId: 'Meter 318',
        coordinates: { lat: 51.0522, lng: -114.1253 },
    },
    {
        id: 'lot_a42',
        name: 'Airport Parking',
        address: 'Calgary International Airport',
        spotId: 'Lot A-42',
        coordinates: { lat: 51.1215, lng: -114.0076 },
    },
];

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