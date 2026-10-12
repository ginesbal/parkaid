import { parkingAPI } from '../api';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    getAllKeys: jest.fn(async () => []),
    multiRemove: jest.fn(async () => {}),
}));

jest.mock('expo-constants', () => ({
    __esModule: true,
    default: { expoConfig: { extra: {} } },
}), { virtual: true });

// Make the next request fail the given way, and return the error it throws.
async function failureFrom(fetchImpl) {
    global.fetch = jest.fn(fetchImpl);
    try {
        await parkingAPI.findNearbySpots(51.04, -114.07, 500, {}, { force: true });
    } catch (error) {
        return error;
    }
    throw new Error('expected the request to fail');
}

beforeAll(() => {
    global.__DEV__ = false; // no mock-data fallback
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

// Screens word their advice by kind: "check your connection" only fits the
// first one.
describe('parkingAPI — what kind of failure', () => {
    it('no response at all is "offline"', async () => {
        const error = await failureFrom(async () => {
            throw new TypeError('Network request failed');
        });
        expect(error.kind).toBe('offline');
    });

    it('no answer before the timeout is "slow"', async () => {
        const error = await failureFrom(async () => {
            const aborted = new Error('Aborted');
            aborted.name = 'AbortError';
            throw aborted;
        });
        expect(error.kind).toBe('slow');
    });

    it('an error status from the server is "server"', async () => {
        const error = await failureFrom(async () => ({ ok: false, status: 503, json: async () => ({}) }));
        expect(error.kind).toBe('server');
    });

    it('an answer that reports a failure is "server"', async () => {
        const error = await failureFrom(async () => ({
            ok: true,
            json: async () => ({ success: false, error: 'database unavailable' }),
        }));
        expect(error.kind).toBe('server');
    });
});

// A free Render server sleeps when idle and takes about a minute to wake.
describe('parkingAPI — waiting out a sleeping server', () => {
    // A fresh client each time: "has the server answered yet" is per session.
    const freshAPI = () => {
        let api;
        jest.isolateModules(() => {
            ({ parkingAPI: api } = require('../api'));
        });
        return api;
    };
    // A request that never answers, until it's given up on.
    const hangingFetch = () => jest.fn((url, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
    }));
    const ok = async () => ({ ok: true, json: async () => ({ success: true, data: [] }) });

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('gives the first request up to 75 seconds, not 8', async () => {
        const api = freshAPI();
        global.fetch = hangingFetch();
        let outcome = null;
        api.findNearbySpots(51.04, -114.07, 500, {}, { force: true })
            .then(() => { outcome = 'answered'; }, (error) => { outcome = error.kind; });

        await jest.advanceTimersByTimeAsync(30000);
        expect(outcome).toBeNull(); // still waiting while the server wakes

        await jest.advanceTimersByTimeAsync(45000);
        expect(outcome).toBe('slow');
    });

    it('goes back to 8 seconds once the server has answered', async () => {
        const api = freshAPI();
        global.fetch = jest.fn(ok);
        await api.findNearbySpots(51.04, -114.07, 500, {}, { force: true });
        expect(api.serverAwake).toBe(true);

        global.fetch = hangingFetch();
        let outcome = null;
        api.findNearbySpots(51.05, -114.07, 500, {}, { force: true })
            .then(() => { outcome = 'answered'; }, (error) => { outcome = error.kind; });
        await jest.advanceTimersByTimeAsync(8000);
        expect(outcome).toBe('slow');
    });

    it('counts an error status as the server being awake', async () => {
        const api = freshAPI();
        global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }));
        await expect(api.findNearbySpots(51.04, -114.07, 500, {}, { force: true })).rejects.toMatchObject({ kind: 'server' });
        expect(api.serverAwake).toBe(true);
    });
});
