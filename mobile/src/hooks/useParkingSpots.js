import { useEffect, useRef, useState } from 'react';
import { parkingAPI } from '../services/api';

// `reloadKey` lets a caller force a fresh fetch for the same inputs (e.g. a
// "Try again" button or pull-to-refresh) by bumping a number. That fetch
// bypasses the response cache, so the user actually gets new data.
export function useParkingSpots(location, radius, filterType = 'all', reloadKey = 0) {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // When the most recent fetch finished (success or failure). Lets callers
    // end a pull-to-refresh spinner exactly when fresh data lands.
    const [lastUpdated, setLastUpdated] = useState(null);

    // track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);
    // Monotonic id of the most recent request. Responses can arrive out of
    // order — a slow network call for the previous search center can land
    // after an instant cache hit for the new one — so only the latest
    // request is allowed to write state.
    const latestRequestRef = useRef(0);
    // A bumped reloadKey asks for one cache-bypassing fetch. Held in a ref
    // until a fetch actually runs, so the request survives other inputs
    // changing during the debounce.
    const prevReloadKeyRef = useRef(reloadKey);
    const forceNextFetchRef = useRef(false);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (reloadKey !== prevReloadKeyRef.current) {
            prevReloadKeyRef.current = reloadKey;
            forceNextFetchRef.current = true;
        }

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

            const force = forceNextFetchRef.current;
            forceNextFetchRef.current = false;
            setError(null);

            try {
                const params = filterType !== 'all' ? { type: filterType } : {};
                const response = await parkingAPI.findNearbySpots(
                    location.latitude,
                    location.longitude,
                    radius,
                    params,
                    { force }
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
                    setLastUpdated(Date.now());
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

    return { spots, loading, error, lastUpdated };
}
