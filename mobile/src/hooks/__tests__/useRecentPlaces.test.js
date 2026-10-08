import { act, renderHook } from '@testing-library/react-hooks';
import { RECENT_PLACES_KEY, useRecentPlaces } from '../useRecentPlaces';

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

const TOWER = { place_id: 'tower', name: 'Calgary Tower', address: '101 9 Ave SW, Calgary', lat: 51.0443, lng: -114.0631 };
const STAMPEDE = { place_id: 'stampede', name: 'Stampede Park', address: '1410 Olympic Way SE, Calgary', lat: 51.0374, lng: -114.0519 };
const LIBRARY = { place_id: 'library', name: 'Central Library', address: '800 3 St SE, Calgary', lat: 51.0455, lng: -114.0545 };
const ZOO = { place_id: 'zoo', name: 'Calgary Zoo', address: '210 St. George\'s Dr NE, Calgary', lat: 51.0459, lng: -114.0281 };

const stored = () => JSON.parse(mockStore[RECENT_PLACES_KEY] || '[]').map((p) => p.place_id);

beforeEach(() => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
    jest.clearAllMocks();
});

async function renderRecent() {
    const hook = renderHook(() => useRecentPlaces());
    await act(async () => {});
    return hook;
}

describe('useRecentPlaces', () => {
    it('keeps the newest first, without repeats, and remembers them on the phone', async () => {
        const { result } = await renderRecent();
        act(() => result.current.rememberPlace(TOWER));
        act(() => result.current.rememberPlace(STAMPEDE));
        act(() => result.current.rememberPlace({ ...TOWER, types: ['point_of_interest'] }));

        expect(result.current.recentPlaces.map((p) => p.place_id)).toEqual(['tower', 'stampede']);
        expect(stored()).toEqual(['tower', 'stampede']);
        // Only what's needed to go back there.
        expect(result.current.recentPlaces[0]).toEqual(TOWER);
    });

    it('keeps the last three', async () => {
        const { result } = await renderRecent();
        [TOWER, STAMPEDE, LIBRARY, ZOO].forEach((place) => act(() => result.current.rememberPlace(place)));
        expect(result.current.recentPlaces.map((p) => p.place_id)).toEqual(['zoo', 'library', 'stampede']);
    });

    it('treats a place without an id as the same place if it is in the same spot', async () => {
        const { result } = await renderRecent();
        act(() => result.current.rememberPlace({ name: 'Here', address: 'Somewhere', lat: 51.04431, lng: -114.06311 }));
        act(() => result.current.rememberPlace({ name: 'Here again', address: 'Somewhere', lat: 51.044312, lng: -114.063108 }));
        expect(result.current.recentPlaces.map((p) => p.name)).toEqual(['Here again']);
    });

    it('loads what was saved before', async () => {
        mockStore[RECENT_PLACES_KEY] = JSON.stringify([STAMPEDE, TOWER]);
        const { result } = await renderRecent();
        expect(result.current.recentPlaces).toEqual([STAMPEDE, TOWER]);
    });

    it('keeps a place picked before the saved list loaded, ahead of the rest', async () => {
        mockStore[RECENT_PLACES_KEY] = JSON.stringify([STAMPEDE, TOWER]);
        const { result } = renderHook(() => useRecentPlaces());
        act(() => result.current.rememberPlace(LIBRARY)); // storage hasn't answered yet
        await act(async () => {});
        expect(result.current.recentPlaces.map((p) => p.place_id)).toEqual(['library', 'stampede', 'tower']);
        expect(stored()).toEqual(['library', 'stampede', 'tower']);
    });

    it('ignores saved data it cannot use', async () => {
        mockStore[RECENT_PLACES_KEY] = JSON.stringify([{ name: 'No coordinates' }, TOWER, null]);
        const { result } = await renderRecent();
        expect(result.current.recentPlaces).toEqual([TOWER]);

        mockStore[RECENT_PLACES_KEY] = '{not json';
        const broken = await renderRecent();
        expect(broken.result.current.recentPlaces).toEqual([]);
    });

    it('forgets everything on clear', async () => {
        mockStore[RECENT_PLACES_KEY] = JSON.stringify([STAMPEDE, TOWER]);
        const { result } = await renderRecent();
        act(() => result.current.clearRecentPlaces());
        expect(result.current.recentPlaces).toEqual([]);
        expect(mockStore[RECENT_PLACES_KEY]).toBeUndefined();
    });
});
