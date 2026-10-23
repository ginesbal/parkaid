import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECENT_SEARCH_MAX_AGE } from '../../constants/session';
import { recallSearch, rememberSearch } from '../recentSearch';

const NOW = 1_800_000_000_000;
const spot = (id, distance, type = 'on_street') => ({ id, distance, spot_type: type });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('recentSearch', () => {
    beforeEach(() => AsyncStorage.clear());

    it('keeps the three closest places, without permit-only blocks', async () => {
        rememberSearch([spot(1, 300), spot(2, 40, 'residential'), spot(3, 120), spot(4, 80), spot(5, 200)], NOW);
        await flush();
        const saved = await recallSearch(NOW + 1000);
        expect(saved.spots.map((s) => s.id)).toEqual([4, 3, 5]);
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
