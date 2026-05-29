import Constants from 'expo-constants';

// get values from app.config.js extra field
const { apiUrl, googleMapsApiKey, supabaseUrl, supabaseAnonKey } = Constants.expoConfig.extra || {};

export const API_URL = apiUrl || 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY = googleMapsApiKey || '';
export const SUPABASE_URL = supabaseUrl || '';
export const SUPABASE_ANON_KEY = supabaseAnonKey || '';

export const DEFAULT_LOCATION = {
    latitude: 51.0447,
    longitude: -114.0719,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export const SEARCH_RADIUS_OPTIONS = [
    { label: '250m', value: 250 },
    { label: '500m', value: 500 },
    { label: '1km', value: 1000 },
    { label: '2km', value: 2000 },
];