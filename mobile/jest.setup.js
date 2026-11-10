// AsyncStorage has no native module under Jest; use the in-memory mock it ships.
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
