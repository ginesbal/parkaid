import { act, renderHook } from '@testing-library/react-hooks';
import { useMinuteClock } from '../useMinuteClock';

afterEach(() => {
    jest.useRealTimers();
});

describe('useMinuteClock', () => {
    it('updates on each minute boundary, and not in between', () => {
        jest.useFakeTimers({ now: new Date('2026-10-07T12:00:30Z') });
        const { result } = renderHook(() => useMinuteClock());
        const first = result.current;

        act(() => { jest.advanceTimersByTime(29000); }); // 12:00:59
        expect(result.current).toBe(first);

        act(() => { jest.advanceTimersByTime(1000); });  // 12:01:00
        expect(new Date(result.current).toISOString()).toBe('2026-10-07T12:01:00.000Z');

        act(() => { jest.advanceTimersByTime(60000); }); // 12:02:00
        expect(new Date(result.current).toISOString()).toBe('2026-10-07T12:02:00.000Z');
    });

    it('stops when unmounted', () => {
        jest.useFakeTimers();
        const { unmount } = renderHook(() => useMinuteClock());
        expect(jest.getTimerCount()).toBe(1);
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});
