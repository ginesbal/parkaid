import { act, renderHook } from '@testing-library/react-hooks';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { useLocationManager } from '../useLocationManager';

const mockStore = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async (key) => (key in mockStore ? mockStore[key] : null)),
    setItem: jest.fn(async (key, value) => {
        mockStore[key] = value;
    }),
}));

jest.mock('react-native', () => ({
    AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 51.05, longitude: -114.06 } })),
    reverseGeocodeAsync: jest.fn(async () => [{ district: 'Beltline' }]),
    Accuracy: { Balanced: 3 },
}), { virtual: true });

beforeEach(() => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
    jest.clearAllMocks();
    global.__DEV__ = false;
});

async function renderLocation() {
    const hook = renderHook(() => useLocationManager());
    await act(async () => {});
    return hook;
}

describe('useLocationManager — when location is refused', () => {
    it('falls back to downtown, says so, and flags that Settings can fix it', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
        const { result } = await renderLocation();

        expect(result.current.locationDenied).toBe(true);
        expect(result.current.location.name).toBe('Downtown Calgary');
        expect(result.current.locationError).toBe('Showing downtown Calgary. Turn on location to see spots near you.');
    });

    it('uses your location once you turn it on in Settings and come back', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
        const { result } = await renderLocation();
        const onAppStateChange = AppState.addEventListener.mock.calls.at(-1)[1];

        Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        await act(async () => {
            await onAppStateChange('active');
        });

        expect(result.current.locationDenied).toBe(false);
        expect(result.current.locationError).toBeNull();
        expect(result.current.location).toMatchObject({ latitude: 51.05, longitude: -114.06, name: 'Beltline' });
    });

    it("doesn't ask again when you come back with it still off", async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
        await renderLocation();
        const onAppStateChange = AppState.addEventListener.mock.calls.at(-1)[1];

        Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
        await act(async () => {
            await onAppStateChange('active');
        });

        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1); // only the first launch
    });
});
