import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, parkingAPI } from '../api';

jest.mock('../../constants/config', () => ({ API_URL: 'https://api.test' }));

const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const SPOTS = { success: true, data: [{ id: 1 }] };
const find = (fresh = true) => parkingAPI.findNearbySpots(51, -114, 250, {}, { fresh });

describe('parkingAPI', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
        parkingAPI.isOnline = true;
        global.fetch = jest.fn();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    it('says when fresh data was saved', async () => {
        fetch.mockReturnValue(ok(SPOTS));
        const before = Date.now();
        const response = await find();
        expect(response.data).toEqual(SPOTS.data);
        expect(response.savedAt).toBeGreaterThanOrEqual(before);
        expect(response.staleBecause).toBeNull();
    });

    it('tells no connection, timeouts and server errors apart', async () => {
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        await expect(find()).rejects.toMatchObject({ kind: 'offline' });

        fetch.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        await expect(find()).rejects.toMatchObject({ kind: 'timeout' });

        fetch.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }));
        const error = await find().catch((e) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ kind: 'server', status: 500 });

        fetch.mockReturnValueOnce(ok({ success: false, error: 'boom' }));
        await expect(find()).rejects.toMatchObject({ kind: 'server' });
    });

    it('falls back to the saved copy, saying how old and why', async () => {
        fetch.mockReturnValueOnce(ok(SPOTS));
        const first = await find();
        fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const fallback = await find();
        expect(fallback.data).toEqual(SPOTS.data);
        expect(fallback.savedAt).toBe(first.savedAt);
        expect(fallback.staleBecause).toBe('offline');
    });
});
