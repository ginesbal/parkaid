import { useEffect, useRef, useState } from 'react';
import { parkingAPI } from '../services/api';

// `reloadKey` lets a caller force a fresh fetch for the same inputs (e.g. a
// "Try again" button after a network error) by bumping a number.
export function useParkingSpots(location, radius, filterType = 'all', reloadKey = 0) {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);
    // Monotonic id of the most recent request. Responses can arrive out of
    // order — a slow network call for the previous search center can land
    // after an instant cache hit for the new one — so only the latest
    // request is allowed to write state.
    const latestRequestRef = useRef(0);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        // do not fetch if no location
        if (!location?.latitude || !location?.longitude) {
            return;
        }

        const requestId = ++latestRequestRef.current;
        const isCurrent = () => isMountedRef.current && requestId === latestRequestRef.current;

        // Mark loading as soon as a fetch is scheduled, not after the
        // debounce — otherwise the first 300ms reads as "no spots here".
        setLoading(true);

        const fetchSpots = async () => {
            if (!isCurrent()) return;

            setError(null);

            try {
                const params = filterType !== 'all' ? { type: filterType } : {};
                const response = await parkingAPI.findNearbySpots(
                    location.latitude,
                    location.longitude,
                    radius,
                    params
                );

                if (isCurrent()) {
                    setSpots(response?.data || []);
                }
            } catch (err) {
                if (isCurrent()) {
                    setError(err.message || 'Failed to load parking spots');
                    setSpots([]);
                }
            } finally {
                if (isCurrent()) {
                    setLoading(false);
                }
            }
        };

        // debounce the API call by 300ms
        const timeoutId = setTimeout(fetchSpots, 300);

        // cleanup: cancel the timeout if dependencies change
        return () => {
            clearTimeout(timeoutId);
        };
    }, [location?.latitude, location?.longitude, radius, filterType, reloadKey]);

    return { spots, loading, error };
}
