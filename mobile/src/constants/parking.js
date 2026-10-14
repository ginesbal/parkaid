
import { Platform } from 'react-native';

export const LOCATION_STORAGE_KEY = 'userLocation';

// The web build is a portfolio demo. Most visitors aren't in Calgary, where
// the parking data is, so it starts downtown instead of asking where they
// are (which would put them on an empty map).
export const USE_DEVICE_LOCATION = Platform.OS !== 'web';

// Meters -> whole minutes of walking (min 1). Matches backend walkingTime
// (distance / 80 m per minute).
export const WALK_SPEED_M_PER_MIN = 80;
export const metersToWalkMinutes = (m) =>
    Math.max(1, Math.round((Number(m) || 0) / WALK_SPEED_M_PER_MIN));
export const minutesToMeters = (minutes) => minutes * WALK_SPEED_M_PER_MIN;

// ===== How far you'll walk — single source of truth =====
// One continuous choice, in minutes of walking (the unit every list row leads
// with), not a set of preset distances. Both screens fetch once at the
// longest walk and narrow on the phone, so moving the slider is instant.
export const WALK_MINUTES = { min: 1, max: 25, default: 6 };
export const FETCH_RADIUS = minutesToMeters(WALK_MINUTES.max); // 2 km

// "a 6-minute walk" ("an 8-minute walk"), for sentences.
export const walkPhrase = (minutes) => `${[8, 11, 18].includes(minutes) ? 'an' : 'a'} ${minutes}-minute walk`;

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
