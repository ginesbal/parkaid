import { act, renderHook } from '@testing-library/react-hooks';
import { useSessionManager } from '../useSessionManager';

jest.mock('@react-native-async-storage/async-storage', () => {
    const store = {};
    return {
        getItem: jest.fn(async (key) => (key in store ? store[key] : null)),
        setItem: jest.fn(async (key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn(async (key) => {
            delete store[key];
        }),
    };
});

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
    Animated: {
        Value: function Value(initial) {
            this.value = initial;
            this.setValue = (next) => {
                this.value = next;
            };
        },
        loop: () => ({ start: () => {}, stop: () => {} }),
        sequence: () => ({}),
        timing: () => ({}),
    },
}));

async function renderWithActiveSession() {
    const hook = renderHook(() => useSessionManager());
    // Let the initial read from storage settle.
    await act(async () => {});
    act(() => {
        hook.result.current.setVehiclePlate('ABC 123');
    });
    await act(async () => {
        await hook.result.current.startSession();
    });
    return hook;
}

describe('useSessionManager — extending a session', () => {
    it('adds the chosen minutes to the end time and duration', async () => {
        const { result } = await renderWithActiveSession();
        const endBefore = new Date(result.current.session.scheduledEnd).getTime();
        const durationBefore = result.current.session.duration;

        await act(async () => {
            await result.current.extendSession(15);
        });

        const endAfter = new Date(result.current.session.scheduledEnd).getTime();
        expect(endAfter - endBefore).toBe(15 * 60000);
        expect(result.current.session.duration).toBe(durationBefore + 15);
    });

    // Regression: the screen used to call extendSession() with no argument,
    // which built an Invalid Date and threw a RangeError.
    it('ignores a missing or invalid amount instead of throwing', async () => {
        const { result } = await renderWithActiveSession();
        const endBefore = result.current.session.scheduledEnd;

        await act(async () => {
            await result.current.extendSession(undefined);
            await result.current.extendSession(NaN);
            await result.current.extendSession(-5);
        });

        expect(result.current.session.scheduledEnd).toBe(endBefore);
    });
});
