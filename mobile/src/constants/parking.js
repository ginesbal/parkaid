
export const DEFAULT_SEARCH_RADIUS = 250; // meters
export const LOCATION_STORAGE_KEY = 'userLocation';

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
