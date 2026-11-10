import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION, LOCATION_STORAGE_KEY } from '../../constants/parking';
import { useLocationManager } from '../useLocationManager';

jest.mock('expo-location', () => ({
    Accuracy: { Balanced: 3 },
    getForegroundPermissionsAsync: jest.fn(),
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

const BELTLINE = { latitude: 51.0386, longitude: -114.0719 };
const fixAt = (point) => ({ coords: point });
const granted = { granted: true, canAskAgain: true };

describe('useLocationManager', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        Location.getForegroundPermissionsAsync.mockResolvedValue(granted);
    });
    afterEach(() => jest.restoreAllMocks());

    it('starts from the saved fix, then uses a fresh one and saves it', async () => {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ latitude: 51.05, longitude: -114.08, savedAt: 1 }));
        let answer;
        Location.getCurrentPositionAsync.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        const { result } = renderHook(() => useLocationManager());
        await waitFor(() => expect(result.current.source).toBe('saved'));
        expect(result.current.isLoadingLocation).toBe(false);
        await act(async () => answer(fixAt(BELTLINE)));
        await waitFor(() => expect(result.current.source).toBe('gps'));
        expect(result.current.location).toEqual(BELTLINE);
        expect(JSON.parse(await AsyncStorage.getItem(LOCATION_STORAGE_KEY))).toMatchObject(BELTLINE);
    });

    it('asks once on launch, and shows downtown when the answer is no', async () => {
        Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
        const { result } = renderHook(() => useLocationManager());
        await waitFor(() => expect(result.current.source).toBe('default'));
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(result.current.location).toEqual(DEFAULT_LOCATION);
        expect(result.current.permission).toBe('blocked');
    });

    it('can look without asking, for screens that only need a hint', async () => {
        Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
        const { result } = renderHook(() => useLocationManager({ ask: false }));
        await waitFor(() => expect(result.current.source).toBe('default'));
        expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
        expect(result.current.permission).toBe('denied');
    });

    it('shows downtown when the phone is outside Calgary', async () => {
        Location.getCurrentPositionAsync.mockResolvedValue(fixAt({ latitude: 53.5461, longitude: -113.4938 }));
        const { result } = renderHook(() => useLocationManager());
        await waitFor(() => expect(result.current.source).toBe('outside'));
        expect(result.current.location).toEqual(DEFAULT_LOCATION);
    });

    it('keeps the saved fix, and says so, when no fresh one comes', async () => {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ ...BELTLINE, savedAt: 5 }));
        Location.getCurrentPositionAsync.mockRejectedValue(new Error('Location unavailable'));
        const { result } = renderHook(() => useLocationManager());
        await waitFor(() => expect(result.current.locating).toBe(false));
        await waitFor(() => expect(result.current.source).toBe('saved'));
        expect(result.current.location).toEqual(BELTLINE);
        expect(result.current.savedAt).toBe(5);
    });

    it('keeps the same point for a small move, so the list is not fetched again', async () => {
        Location.getCurrentPositionAsync.mockResolvedValue(fixAt(BELTLINE));
        const { result } = renderHook(() => useLocationManager());
        await waitFor(() => expect(result.current.source).toBe('gps'));
        const first = result.current.location;
        Location.getCurrentPositionAsync.mockResolvedValue(fixAt({ latitude: 51.0388, longitude: -114.0719 }));
        await act(async () => result.current.refreshLocation({ force: true }));
        expect(result.current.location).toBe(first);
    });
});
