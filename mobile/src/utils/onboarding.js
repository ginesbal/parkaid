// First-run flag for the Welcome screen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './loggers';

const WELCOMED_KEY = 'parkaid.welcomed';

// Storage errors resolve to true: a broken read should open the app, not trap
// the user on Welcome.
export async function hasSeenWelcome() {
    try {
        return (await AsyncStorage.getItem(WELCOMED_KEY)) === '1';
    } catch (error) {
        logger.log('welcome flag read failed', { message: error?.message }, 'WARN');
        return true;
    }
}

export async function markWelcomeSeen() {
    try {
        await AsyncStorage.setItem(WELCOMED_KEY, '1');
    } catch (error) {
        logger.log('welcome flag write failed', { message: error?.message }, 'WARN');
    }
}
