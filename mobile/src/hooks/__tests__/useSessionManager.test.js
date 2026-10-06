import { act, renderHook } from '@testing-library/react-hooks';
import { Alert } from 'react-native';
import { UNDO_WINDOW_MS } from '../../constants/session';
import { fitDurationToLimit, useSessionManager } from '../useSessionManager';

const mockStore = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async (key) => (key in mockStore ? mockStore[key] : null)),
    setItem: jest.fn(async (key, value) => {
        mockStore[key] = value;
    }),
    removeItem: jest.fn(async (key) => {
        delete mockStore[key];
    }),
}));

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));

// A metered spot as the map hands it over (see getTimerSpot).
const METERED_SPOT = {
    id: 'spot-1',
    address: '7 Ave SW',
    secondary: 'From 4 St SW to 5 St SW',
    hourlyRate: 3,
    priceText: '$3.00 per hour',
    maxStayMinutes: 90,
    maxStayText: '1 hour 30 minutes',
};

async function renderTimer() {
    const hook = renderHook(() => useSessionManager());
    // Let the initial read from storage settle.
    await act(async () => {});
    return hook;
}

async function startTimer(hook, { spot = null, minutes = null } = {}) {
    if (spot) act(() => hook.result.current.setTimerSpot(spot));
    if (minutes) act(() => hook.result.current.setSelectedDuration(minutes));
    await act(async () => {
        await hook.result.current.startSession();
    });
}

// Jump the clock and let the hook's one-second tick pick it up.
function moveClockTo(isoTime) {
    act(() => {
        jest.setSystemTime(new Date(isoTime));
        jest.advanceTimersByTime(1000);
    });
}

beforeEach(() => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('fitDurationToLimit', () => {
    it('keeps a duration that fits', () => {
        expect(fitDurationToLimit(120, 60)).toBe(60);
    });

    it('drops to the longest preset inside the limit', () => {
        expect(fitDurationToLimit(90, 180)).toBe(60);
    });

    it('uses a limit shorter than every preset as-is', () => {
        expect(fitDurationToLimit(15, 60)).toBe(15);
    });

    it('leaves the duration alone when there is no limit', () => {
        expect(fitDurationToLimit(null, 180)).toBe(180);
    });
});

describe('useSessionManager — starting a timer', () => {
    it('starts without a spot, and never asks for a plate', async () => {
        const hook = await renderTimer();
        await startTimer(hook);

        const { session, endTime, estimatedCost } = hook.result.current;
        expect(session.spot).toBeNull();
        expect(session).not.toHaveProperty('vehiclePlate');
        expect(session.duration).toBe(60);
        expect(endTime.getTime() - new Date(session.startedAt).getTime()).toBe(60 * 60000);
        // No rate, no made-up cost.
        expect(estimatedCost).toBeNull();
    });

    it("keeps the spot's summary and estimates cost from its rate", async () => {
        const hook = await renderTimer();
        await startTimer(hook, { spot: METERED_SPOT });

        expect(hook.result.current.session.spot).toEqual(METERED_SPOT);
        expect(hook.result.current.estimatedCost).toBe(3); // 1 hour at $3/hr
    });

    it("fits the planned duration inside the spot's posted limit", async () => {
        const hook = await renderTimer();
        act(() => hook.result.current.setSelectedDuration(180));
        act(() => hook.result.current.setTimerSpot(METERED_SPOT)); // 90 min max

        expect(hook.result.current.selectedDuration).toBe(60);
    });

    // Regression: the clock only ticks once a second, so a timer started
    // between ticks read 01:00:01 — "1 hour 1 minute" — until the next one.
    it('reads the full duration right after starting', async () => {
        jest.useFakeTimers({ now: new Date('2026-10-06T12:00:00.000Z') });
        const hook = await renderTimer();
        act(() => {
            jest.setSystemTime(new Date('2026-10-06T12:00:00.500Z')); // between ticks
        });
        await startTimer(hook);

        expect(hook.result.current.timeRemainingMs).toBe(60 * 60000);
        expect(hook.result.current.timeRemaining).toBe(60);
    });
});

describe('useSessionManager — adding time', () => {
    it('adds the chosen minutes to the end time and duration', async () => {
        const hook = await renderTimer();
        await startTimer(hook);
        const endBefore = new Date(hook.result.current.session.scheduledEnd).getTime();

        await act(async () => {
            await hook.result.current.extendSession(15);
        });

        const endAfter = new Date(hook.result.current.session.scheduledEnd).getTime();
        expect(endAfter - endBefore).toBe(15 * 60000);
        expect(hook.result.current.session.duration).toBe(75);
    });

    it("won't plan past the spot's posted limit", async () => {
        const hook = await renderTimer();
        await startTimer(hook, { spot: METERED_SPOT, minutes: 60 }); // 90 min max

        expect(hook.result.current.remainingAllowance).toBe(30);
        expect(hook.result.current.canExtendBy(30)).toBe(true);
        expect(hook.result.current.canExtendBy(60)).toBe(false);

        const endBefore = hook.result.current.session.scheduledEnd;
        let outcome;
        await act(async () => {
            outcome = await hook.result.current.extendSession(60);
        });
        expect(outcome).toBeNull();
        expect(hook.result.current.session.scheduledEnd).toBe(endBefore);

        await act(async () => {
            await hook.result.current.extendSession(30);
        });
        expect(hook.result.current.session.duration).toBe(90);
        expect(hook.result.current.remainingAllowance).toBe(0);
    });

    it('undo restores the timer from before the last extension', async () => {
        const hook = await renderTimer();
        await startTimer(hook);
        const before = hook.result.current.session;

        await act(async () => {
            await hook.result.current.extendSession(30);
        });
        expect(hook.result.current.lastExtension).toMatchObject({ minutes: 30 });

        await act(async () => {
            await hook.result.current.undoExtension();
        });
        expect(hook.result.current.session).toEqual(before);
        expect(hook.result.current.lastExtension).toBeNull();
    });

    it('offers undo only briefly', async () => {
        jest.useFakeTimers();
        const hook = await renderTimer();
        await startTimer(hook);

        await act(async () => {
            await hook.result.current.extendSession(15);
        });
        expect(hook.result.current.lastExtension).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(UNDO_WINDOW_MS);
        });
        expect(hook.result.current.lastExtension).toBeNull();
    });

    // Regression: the screen used to call extendSession() with no argument,
    // which built an Invalid Date and threw a RangeError.
    it('ignores a missing or invalid amount instead of throwing', async () => {
        const hook = await renderTimer();
        await startTimer(hook);
        const endBefore = hook.result.current.session.scheduledEnd;

        await act(async () => {
            await hook.result.current.extendSession(undefined);
            await hook.result.current.extendSession(NaN);
            await hook.result.current.extendSession(-5);
        });

        expect(hook.result.current.session.scheduledEnd).toBe(endBefore);
        expect(hook.result.current.lastExtension).toBeNull();
    });
});

describe('useSessionManager — counting down', () => {
    // Regression: remaining minutes rounded down, so the last 59 seconds
    // read as "expired" and the countdown jumped from 1:00 straight to zero.
    it('reads zero only when time is actually up', async () => {
        jest.useFakeTimers({ now: new Date('2026-10-06T12:00:00Z') });
        const hook = await renderTimer();
        await startTimer(hook, { minutes: 30 });

        moveClockTo('2026-10-06T12:29:00Z'); // 59 seconds left after the tick
        expect(hook.result.current.timeRemaining).toBe(1);
        expect(hook.result.current.sessionState).toBe('expiring');

        moveClockTo('2026-10-06T12:30:00Z');
        expect(hook.result.current.timeRemaining).toBe(0);
        expect(hook.result.current.sessionState).toBe('expired');
    });
});

describe('useSessionManager — ending a timer', () => {
    it('asks before ending a running timer', async () => {
        const hook = await renderTimer();
        await startTimer(hook);

        act(() => hook.result.current.endSession());
        expect(Alert.alert).toHaveBeenCalledWith(
            'End this timer?',
            'You still have 1 hour left.',
            expect.any(Array)
        );

        const buttons = Alert.alert.mock.calls[0][2];
        await act(async () => {
            await buttons.find((button) => button.style === 'destructive').onPress();
        });
        expect(hook.result.current.session).toBeNull();
    });

    it('clears an expired timer without asking', async () => {
        jest.useFakeTimers({ now: new Date('2026-10-06T12:00:00Z') });
        const hook = await renderTimer();
        await startTimer(hook, { minutes: 30 });

        moveClockTo('2026-10-06T12:31:00Z');
        expect(hook.result.current.sessionState).toBe('expired');

        await act(async () => {
            hook.result.current.endSession();
        });
        expect(Alert.alert).not.toHaveBeenCalled();
        expect(hook.result.current.session).toBeNull();
    });
});
