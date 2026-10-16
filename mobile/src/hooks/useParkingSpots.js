import { useCallback, useEffect, useRef, useState } from 'react';
import { parkingAPI } from '../services/api';

export function useParkingSpots(location, radius, filterType = 'all') {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);
    // Only the newest request may write state; an older one finishing late
    // must not overwrite its spots or switch loading off.
    const requestIdRef = useRef(0);
    // refetch() bumps the nonce; the next request skips the API cache.
    const [nonce, setNonce] = useState(0);
    const freshRef = useRef(false);
    const refetch = useCallback(() => {
        freshRef.current = true;
        setNonce((n) => n + 1);
    }, []);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        const isCurrent = () => isMountedRef.current && requestId === requestIdRef.current;

        // do not fetch if no location
        if (!location?.latitude || !location?.longitude) {
            setLoading(false);
            return;
        }

        // Loading starts when the fetch is scheduled, not after the debounce,
        // so screens never read "no spots" while a search is about to run.
        setLoading(true);

        let timeoutId;

        const fetchSpots = async () => {
            if (!isCurrent()) return;

            // Read the refetch flag only when a request really goes out, so a
            // debounced request that gets cancelled does not swallow it.
            const fresh = freshRef.current;
            freshRef.current = false;

            setLoading(true);
            setError(null);

            try {
                const params = filterType !== 'all' ? { type: filterType } : {};
                const response = await parkingAPI.findNearbySpots(
                    location.latitude,
                    location.longitude,
                    radius,
                    params,
                    { fresh }
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
        timeoutId = setTimeout(() => {
            fetchSpots();
        }, 300);

        // cleanup: cancel the timeout if dependencies change
        return () => {
            clearTimeout(timeoutId);
        };
    }, [location?.latitude, location?.longitude, radius, filterType, nonce]);

    return { spots, loading, error, refetch };
}   