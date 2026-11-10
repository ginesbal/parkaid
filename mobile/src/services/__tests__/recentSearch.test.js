import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECENT_SEARCH_MAX_AGE } from '../../constants/session';
import { orderPlaces, recallSearch, rememberSearch } from '../recentSearch';

const NOW = 1_800_000_000_000;
const spot = (id, distance, type = 'on_street') => ({ id, distance, spot_type: type });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
// A spot at a point along 6 Ave SW, about 70 m apart per step.
const at = (id, step) => ({
    id,
    spot_type: 'on_street',
    coordinates: { type: 'Point', coordinates: [-114.07 + step * 0.001, 51.045] },
});

describe('recentSearch', () => {
    beforeEach(() => AsyncStorage.clear());

    it('keeps the eight closest places, without permit-only blocks', async () => {
        const spots = [spot('p', 40, 'residential'), ...[9, 3, 7, 1, 10, 5, 2, 8, 4, 6].map((n) => spot(n, n * 50))];
        rememberSearch(spots, NOW);
        await flush();
        const saved = await recallSearch(NOW + 1000);
        expect(saved.spots.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(saved.savedAt).toBe(NOW);
    });

    it('leaves the last search in place when a new one has nothing to offer', async () => {
        rememberSearch([spot(1, 50)], NOW);
        await flush();
        rememberSearch([spot(2, 10, 'residential')], NOW + 1000);
        rememberSearch([], NOW + 2000);
        await flush();
        expect((await recallSearch(NOW + 3000)).spots.map((s) => s.id)).toEqual([1]);
    });

    it('forgets a search too old to be where the car is', async () => {
        rememberSearch([spot(1, 50)], NOW);
        await flush();
        expect(await recallSearch(NOW + RECENT_SEARCH_MAX_AGE + 1)).toBeNull();
    });

    it('has nothing before the first search', async () => {
        expect(await recallSearch(NOW)).toBeNull();
    });
});

describe('orderPlaces', () => {
    const places = [at('a', 0), at('b', 1), at('c', 2), at('d', 3), at('e', 4)];

    it('offers the three places nearest the phone, nearest first, with how far each is', () => {
        const here = { latitude: 51.045, longitude: -114.07 + 3 * 0.001 };
        const offered = orderPlaces(places, here);
        expect(offered.map((p) => p.id)).toEqual(['d', 'c', 'e']);
        expect(offered[0].away).toBe(0);
        expect(offered[1].away).toBeGreaterThan(60);
        expect(offered[1].away).toBeLessThan(80);
    });

    it('keeps the search’s order without the phone’s position', () => {
        const offered = orderPlaces(places, null);
        expect(offered.map((p) => p.id)).toEqual(['a', 'b', 'c']);
        expect(offered.every((p) => p.away === null)).toBe(true);
    });

    it('puts places it cannot place after the rest', () => {
        const here = { latitude: 51.045, longitude: -114.07 };
        const offered = orderPlaces([{ id: 'x', spot_type: 'on_street' }, at('a', 2), at('b', 1)], here);
        expect(offered.map((p) => p.id)).toEqual(['b', 'a', 'x']);
        expect(offered[2].away).toBeNull();
    });
});
