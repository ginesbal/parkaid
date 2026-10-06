
export const DEFAULT_SEARCH_RADIUS = 500; // meters — matches the backend default
export const LOCATION_STORAGE_KEY = 'userLocation';

// ===== Search radius — single source of truth =====
// Four familiar presets shared by every radius control in the app. The map
// fetches once at FETCH_RADIUS (the largest preset) and narrows client-side,
// so switching presets is instant and never refetches.
export const RADIUS_OPTIONS = [
    { value: 250, label: '250m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
];
export const FETCH_RADIUS = 2000;

// Meters -> whole minutes of walking (min 1). Matches backend walkingTime
// (distance / 80 m per minute). Used for accessibility labels.
export const WALK_SPEED_M_PER_MIN = 80;
export const metersToWalkMinutes = (m) =>
    Math.max(1, Math.round((Number(m) || 0) / WALK_SPEED_M_PER_MIN));

export const DEFAULT_LOCATION = {
    latitude: 51.0447,
    longitude: -114.0719,
    name: 'Downtown Calgary'
};

export const REFRESH_INTERVAL = 60000; // 1 minute

export const PARKING_TYPES = {
    ON_STREET: 'on_street',
    OFF_STREET: 'off_street',
    RESIDENTIAL: 'residential',
    GARAGE: 'garage',
    SURFACE_LOT: 'surface_lot'
};

export const PRICE_RANGES = {
    FREE: { min: 0, max: 0, label: 'Free' },
    BUDGET: { min: 0.01, max: 2, label: 'Budget' },
    MODERATE: { min: 2.01, max: 5, label: 'Moderate' },
    PREMIUM: { min: 5.01, max: null, label: 'Premium' }
};
