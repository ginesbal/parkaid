// recentSearch — the closest places from the last search, kept on the phone so
// that after the drive Park can ask "Where are you parked?" with them.
// Permit-only blocks are left out: no one starts a session there.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECENT_SEARCH_MAX_AGE, STORAGE_KEYS } from '../constants/session';
import { distanceMeters } from '../utils/geo';
import { getCoordinates, sortByDistance } from '../utils/spotPresentation';

// Kept: enough that the car is likely among them after a short drive.
const KEEP = 8;
// Offered on Park.
const OFFER = 3;

// The places to offer, each with `away`: metres from `from`, the phone's
// position now. Nearest first; without a position, in the search's order and
// with `away` null. The search may have been made before the drive, so its
// own order says little about where the car is.
export function orderPlaces(spots, from, count = OFFER) {
    const places = (spots || []).map((spot) => {
        const coords = from ? getCoordinates(spot) : null;
        return { ...spot, away: coords ? Math.round(distanceMeters(from, coords)) : null };
    });
    if (from) places.sort((a, b) => (a.away ?? Infinity) - (b.away ?? Infinity));
    return places.slice(0, count);
}

// A search with nothing to offer leaves the last one in place.
export function rememberSearch(spots, now = Date.now()) {
    const places = sortByDistance((spots || []).filter((spot) => spot && spot.spot_type !== 'residential'))
        .slice(0, KEEP);
    if (!places.length) return;
    AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCH, JSON.stringify({ spots: places, savedAt: now }))
        .catch((error) => console.warn('Failed to remember the search:', error));
}

// { spots, savedAt }, or null when there is none or it is too old to be
// where the car is now.
export async function recallSearch(now = Date.now()) {
    try {
        const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCH));
        return saved && Array.isArray(saved.spots) && saved.spots.length && now - saved.savedAt < RECENT_SEARCH_MAX_AGE
            ? saved
            : null;
    } catch (error) {
        return null;
    }
}
