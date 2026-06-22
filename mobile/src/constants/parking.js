
export const DEFAULT_SEARCH_RADIUS = 400; // meters (~5 min walk)
export const LOCATION_STORAGE_KEY = 'userLocation';

// ===== Search radius — single source of truth =====
// Previously four different scales lived across the app (map presets,
// DISTANCE_OPTIONS, SEARCH_RADIUS_OPTIONS, FilterBar). The map now uses one
// continuous range, framed in walk time. Calgary's backend computes walking
// time as distance / 80 m/min, so we mirror that here.
export const RADIUS_MIN = 120;        // meters (~1.5 min walk)
export const RADIUS_MAX = 1500;       // meters (~19 min walk) — also the fetch radius
export const RADIUS_DEFAULT = DEFAULT_SEARCH_RADIUS;
export const WALK_SPEED_M_PER_MIN = 80;

// Meters -> whole minutes of walking (min 1). Matches backend walkingTime.
export const metersToWalkMinutes = (m) =>
    Math.max(1, Math.round((Number(m) || 0) / WALK_SPEED_M_PER_MIN));

// Friendly distance label: "400 m" / "1.2 km".
export const formatMeters = (m) => {
    const meters = Math.round(Number(m) || 0);
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
};

export const DEFAULT_LOCATION = {
    latitude: 51.0447,
    longitude: -114.0719,
    name: 'Downtown Calgary'
};

export const FILTER_OPTIONS = [
    { key: 'all', label: 'All Types' },
    { key: 'on_street', label: 'Street' },
    { key: 'off_street', label: 'Parking Lot' },
    { key: 'residential', label: 'Residential' }
];

export const DISTANCE_OPTIONS = [
    { value: 150, label: '150m' },
    { value: 250, label: '250m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' }
];

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
