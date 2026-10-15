import { act, renderHook } from '@testing-library/react-hooks';
import { WALK_MINUTES } from '../../constants/parking';
import { resetWalkMinutesForTests, setWalkMinutes, useWalkMinutes } from '../useWalkMinutes';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const mockStore = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async (key) => (key in mockStore ? mockStore[key] : null)),
    setItem: jest.fn(async (key, value) => {
        mockStore[key] = value;
    }),
}));

beforeEach(() => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
    resetWalkMinutesForTests();
});

describe('useWalkMinutes', () => {
    it('starts at the default walk', async () => {
        const { result } = renderHook(() => useWalkMinutes());
        await act(async () => {});
        expect(result.current[0]).toBe(WALK_MINUTES.default);
    });

    it('is one choice: setting it on one screen moves the other', async () => {
        const home = renderHook(() => useWalkMinutes());
        const map = renderHook(() => useWalkMinutes());
        await act(async () => {});
        act(() => home.result.current[1](12));
        expect(home.result.current[0]).toBe(12);
        expect(map.result.current[0]).toBe(12);
    });

    it('remembers the choice between visits', async () => {
        mockStore.walkMinutes = '9';
        const { result } = renderHook(() => useWalkMinutes());
        await act(async () => {});
        expect(result.current[0]).toBe(9);

        act(() => setWalkMinutes(15));
        expect(mockStore.walkMinutes).toBe('15');
    });

    it('ignores values outside the slider', async () => {
        mockStore.walkMinutes = '90';
        const { result } = renderHook(() => useWalkMinutes());
        await act(async () => {});
        expect(result.current[0]).toBe(WALK_MINUTES.default);

        act(() => setWalkMinutes(0));
        act(() => setWalkMinutes(2.5));
        expect(result.current[0]).toBe(WALK_MINUTES.default);
    });
});
