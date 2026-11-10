import { act, renderHook } from '@testing-library/react-native';
import { parkingAPI } from '../../services/api';
import { useParkingSpots } from '../useParkingSpots';

jest.mock('../../services/api', () => ({
    FALLBACK_TIMEOUT: 4000,
    FRESH_FOR: 300000,
    parkingAPI: {
        findNearbySpots: jest.fn(),
        peekNearbySpots: jest.fn(),
    },
}));

const CALGARY = { latitude: 51.0, longitude: -114.0 };

describe('useParkingSpots', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        parkingAPI.peekNearbySpots.mockResolvedValue(null);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('debounces API calls', async () => {
        const mockData = { data: [{ id: 1, address: 'Test' }] };
        parkingAPI.findNearbySpots.mockResolvedValue(mockData);

        const { rerender } = renderHook(
            ({ loc }) => useParkingSpots(loc, 500, 'all'),
            { initialProps: { loc: { latitude: 51.0, longitude: -114.0 } } }
        );

        // Change location 5 times rapidly
        rerender({ loc: { latitude: 51.01, longitude: -114.0 } });
        rerender({ loc: { latitude: 51.02, longitude: -114.0 } });
        rerender({ loc: { latitude: 51.03, longitude: -114.0 } });
        rerender({ loc: { latitude: 51.04, longitude: -114.0 } });
        rerender({ loc: { latitude: 51.05, longitude: -114.0 } });

        // Haven't waited 300ms - no API calls yet
        expect(parkingAPI.findNearbySpots).not.toHaveBeenCalled();

        // Fast-forward past debounce
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // Should only call once with the LAST location
        expect(parkingAPI.findNearbySpots).toHaveBeenCalledTimes(1);
        expect(parkingAPI.findNearbySpots).toHaveBeenCalledWith(
            51.05,
            -114.0,
            500,
            {},
            { fresh: true, timeout: undefined }
        );
    });

    it('reports loading from the moment a search is scheduled', async () => {
        parkingAPI.findNearbySpots.mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useParkingSpots(CALGARY, 500));

        // Inside the debounce window: no request yet, but not "no spots" either.
        expect(result.current.loading).toBe(true);

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(result.current.loading).toBe(false);
    });

    it('handles errors properly', async () => {
        parkingAPI.findNearbySpots.mockRejectedValue(Object.assign(new Error('Network error'), { kind: 'offline' }));

        const { result } = renderHook(() =>
            useParkingSpots({ latitude: 51.0, longitude: -114.0 }, 500)
        );

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(result.current.error).toBe('offline');
        expect(result.current.spots).toEqual([]);
    });

    it('refetch() asks past the cache', async () => {
        parkingAPI.findNearbySpots.mockResolvedValue({ data: [{ id: 1 }] });

        const { result } = renderHook(() => useParkingSpots(CALGARY, 500));
        await act(async () => {
            jest.advanceTimersByTime(300);
        });
        expect(parkingAPI.findNearbySpots).toHaveBeenLastCalledWith(51.0, -114.0, 500, {}, { fresh: true, timeout: undefined });

        await act(async () => {
            result.current.refetch();
        });
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(parkingAPI.findNearbySpots).toHaveBeenCalledTimes(2);
        expect(parkingAPI.findNearbySpots).toHaveBeenLastCalledWith(51.0, -114.0, 500, {}, { fresh: true, timeout: undefined });
        // Refresh does not go back to the saved copy first.
        expect(parkingAPI.peekNearbySpots).toHaveBeenCalledTimes(1);
    });

    it('shows a saved copy at once, then the fresh answer', async () => {
        let answer;
        parkingAPI.peekNearbySpots.mockResolvedValue({ data: [{ id: 'saved' }], savedAt: Date.now() - 20 * 60000 });
        parkingAPI.findNearbySpots.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
        const { result } = renderHook(() => useParkingSpots(CALGARY, 500));
        await act(async () => {
            jest.advanceTimersByTime(300);
        });
        expect(result.current.spots).toEqual([{ id: 'saved' }]);
        expect(result.current.loading).toBe(true);
        // Something to fall back on: give up on the network sooner.
        expect(parkingAPI.findNearbySpots).toHaveBeenLastCalledWith(51.0, -114.0, 500, {}, { fresh: true, timeout: 4000 });
        await act(async () => answer({ data: [{ id: 'fresh' }], savedAt: Date.now() }));
        expect(result.current.spots).toEqual([{ id: 'fresh' }]);
        expect(result.current.loading).toBe(false);
    });

    it('uses a saved copy only minutes old without asking the network', async () => {
        parkingAPI.peekNearbySpots.mockResolvedValue({ data: [{ id: 'saved' }], savedAt: Date.now() - 60000 });
        const { result } = renderHook(() => useParkingSpots(CALGARY, 500));
        await act(async () => {
            jest.advanceTimersByTime(300);
        });
        expect(result.current.spots).toEqual([{ id: 'saved' }]);
        expect(result.current.loading).toBe(false);
        expect(parkingAPI.findNearbySpots).not.toHaveBeenCalled();
    });

    it('ignores a slower, older response', async () => {
        let resolveOld;
        parkingAPI.findNearbySpots
            .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
            .mockResolvedValueOnce({ data: [{ id: 'new' }] });

        const { result, rerender } = renderHook(
            ({ radius }) => useParkingSpots(CALGARY, radius),
            { initialProps: { radius: 150 } }
        );
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        rerender({ radius: 500 });
        await act(async () => {
            jest.advanceTimersByTime(300);
        });
        expect(result.current.spots).toEqual([{ id: 'new' }]);

        // The first request finishes last; it must not overwrite the newer result.
        await act(async () => {
            resolveOld({ data: [{ id: 'old' }] });
        });
        expect(result.current.spots).toEqual([{ id: 'new' }]);
        expect(result.current.loading).toBe(false);
    });
});
