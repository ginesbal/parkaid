import { useCallback, useEffect, useRef, useState } from 'react';
import { FALLBACK_TIMEOUT, FRESH_FOR, parkingAPI } from '../services/api';
import { rememberSearch } from '../services/recentSearch';

// spots, loading, refetch, and:
// error:   why the last load failed with nothing to show ('offline',
//          'timeout' or 'server'; see utils/loadStatus), else null
// savedAt: when the shown spots were fetched (ms)
// stale:   why an older copy is shown instead of fresh data, else null
export function useParkingSpots(location, radius, filterType = 'all') {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState({ savedAt: null, stale: null });

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

            const { latitude, longitude } = location;
            const params = filterType !== 'all' ? { type: filterType } : {};
            const show = (response) => {
                setSpots(response?.data || []);
                setSaved({ savedAt: response?.savedAt ?? null, stale: response?.staleBecause ?? null });
                // Offered on Park as where the car might be.
                rememberSearch(response?.data);
            };

            try {
                // A saved copy first, so the list shows at once; it is refreshed
                // below unless it is only minutes old. (Refresh and Retry skip
                // it: the list on screen stays until the new one comes.)
                const saved = fresh ? null : await parkingAPI.peekNearbySpots(latitude, longitude, radius, params);
                if (saved && isCurrent()) {
                    show(saved);
                    if (Date.now() - saved.savedAt < FRESH_FOR) return;
                }
                if (!isCurrent()) return;

                // With something to fall back on, give up on a slow network sooner.
                const response = await parkingAPI.findNearbySpots(latitude, longitude, radius, params, {
                    fresh: true,
                    timeout: saved ? FALLBACK_TIMEOUT : undefined,
                });
                if (isCurrent()) show(response);
            } catch (err) {
                if (isCurrent()) {
                    setError(err?.kind || 'server');
                    setSpots([]);
                    setSaved({ savedAt: null, stale: null });
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

    return { spots, loading, error, refetch, savedAt: saved.savedAt, stale: saved.stale };
}   