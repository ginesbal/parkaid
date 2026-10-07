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
