import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION, LOCATION_STORAGE_KEY, USE_DEVICE_LOCATION } from '../constants/parking';

// What Home calls the phone's position when the area's name isn't known.
const UNNAMED = 'Your location';

// The area's name ("Beltline", "Calgary"), or null if the lookup fails.
async function placeName({ latitude, longitude }) {
    try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        return address?.district || address?.city || null;
    } catch (error) {
        if (__DEV__) console.log('Reverse geocoding failed:', error);
        return null;
    }
}

export const useLocationManager = () => {
    const [location, setLocation] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState(null);
    // Permission was refused — the one case the user can fix, in Settings.
    const [locationDenied, setLocationDenied] = useState(false);
    const [locationName, setLocationName] = useState('Loading...');
    
    // load location from storage or get current
    const loadLocation = useCallback(async () => {
        try {
            setIsLoadingLocation(true);

            // The web demo starts downtown, without a location prompt.
            if (!USE_DEVICE_LOCATION) {
                setLocation(DEFAULT_LOCATION);
                setLocationName(DEFAULT_LOCATION.name);
                return;
            }
            
            // first, try to load from storage
            const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
            if (stored) {
                const parsedLocation = JSON.parse(stored);
                setLocation(parsedLocation);
                setLocationName(parsedLocation.name || UNNAMED);
                setIsLoadingLocation(false);
                // The map and the app's launch save the phone's position
                // without a name. Look it up rather than guess "downtown".
                if (!parsedLocation.name) {
                    const name = await placeName(parsedLocation);
                    if (name) {
                        const named = { ...parsedLocation, name };
                        setLocation(named);
                        setLocationName(name);
                        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(named));
                    }
                }
                return;
            }
            
            // request permission if not stored
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                // use default location if permission denied
                setLocation(DEFAULT_LOCATION);
                setLocationName(DEFAULT_LOCATION.name);
                setLocationError('Showing downtown Calgary. Turn on location to see spots near you.');
                setLocationDenied(true);
            } else {
                setLocationDenied(false);
                setLocationError(null);
                // get current location
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                
                const newLocation = {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                };
                newLocation.name = (await placeName(newLocation)) || UNNAMED;

                setLocation(newLocation);
                setLocationName(newLocation.name);

                // save to storage
                await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
            }
        } catch (error) {
            console.error('Error loading location:', error);
            setLocationError("Couldn't find your location. Showing downtown Calgary.");
            setLocation(DEFAULT_LOCATION);
            setLocationName(DEFAULT_LOCATION.name);
        } finally {
            setIsLoadingLocation(false);
        }
    }, []);

    // update location
    const updateLocation = useCallback(async (newLocation) => {
        setLocation(newLocation);
        setLocationName(newLocation.name || 'Selected Location');
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
    }, []);

    // initial load
    useEffect(() => {
        loadLocation();
    }, [loadLocation]);

    // Back from Settings with location turned on: use it. Checks without
    // asking, so returning to the app never re-prompts.
    useEffect(() => {
        if (!locationDenied) return undefined;
        const subscription = AppState.addEventListener('change', async (state) => {
            if (state !== 'active') return;
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') loadLocation();
            } catch {
                // stay on the default location
            }
        });
        return () => subscription?.remove?.();
    }, [locationDenied, loadLocation]);
    
    return {
        location,
        locationName,
        isLoadingLocation,
        locationError,
        locationDenied,
        updateLocation,
        refreshLocation: loadLocation
    };
};