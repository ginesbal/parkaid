import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION, LOCATION_STORAGE_KEY } from '../constants/parking';

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
            
            // first, try to load from storage
            const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
            if (stored) {
                const parsedLocation = JSON.parse(stored);
                setLocation(parsedLocation);
                setLocationName(parsedLocation.name || 'Downtown Calgary');
                setIsLoadingLocation(false);
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
                    name: 'Current Location'
                };
                
                // try to get address
                try {
                    const [address] = await Location.reverseGeocodeAsync({
                        latitude: newLocation.latitude,
                        longitude: newLocation.longitude
                    });
                    
                    if (address) {
                        newLocation.name = address.district || address.city || 'Current Location';
                    }
                } catch (error) {
                    if (__DEV__) console.log('Reverse geocoding failed:', error);
                }
                
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