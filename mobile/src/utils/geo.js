// Distances, Calgary's reach, and how Home names the place it searches from.

import { Platform } from 'react-native';
import { DEFAULT_LOCATION } from '../constants/parking';
import { formatClock } from './sessionHelpers';
import { getCoordinates } from './spotPresentation';

const EARTH_RADIUS = 6371000; // metres

// Metres between two { latitude, longitude } points.
export function distanceMeters(a, b) {
    const rad = (deg) => (deg * Math.PI) / 180;
    const dLat = rad(b.latitude - a.latitude);
    const dLng = rad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

// The spot nearest `point` within `maxMeters`, or null. A tap just beside a
// small map pin still picks it.
export function nearestSpot(spots, point, maxMeters) {
    let best = null;
    let bestDistance = maxMeters;
    for (const spot of spots || []) {
        const coords = getCoordinates(spot);
        if (!coords) continue;
        const d = distanceMeters(point, coords);
        if (d <= bestDistance) {
            best = spot;
            bestDistance = d;
        }
    }
    return best;
}

// The City's parking data covers Calgary; further than this from downtown
// there is nothing to show, so Home shows downtown and says why.
export const CALGARY_REACH = 35000; // metres

export function isInCalgary(point) {
    return distanceMeters(point, DEFAULT_LOCATION) <= CALGARY_REACH;
}

// "2:10 PM" today, "Oct 21" before.
function formatWhen(time, now) {
    return new Date(time).toDateString() === new Date(now).toDateString()
        ? formatClock(time)
        : new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// What Home says about where it searches from, or null when it is the
// phone's location now:
//   source:     'gps', 'saved' (an earlier fix), 'default' (downtown, no
//               fix) or 'outside' (downtown: the phone is outside Calgary)
//   permission: 'granted', 'denied' (can still ask) or 'blocked'
// Returns { text, action }: action is 'ask', 'settings', 'retry' or null.
export function describeLocation({ source, savedAt = null, permission = 'granted', now = Date.now() }) {
    if (source === 'saved') {
        return {
            text: savedAt ? `Using your location from ${formatWhen(savedAt, now)}.` : 'Using your last known location.',
            action: 'retry',
        };
    }
    if (source === 'outside') {
        return { text: 'You’re outside Calgary, so this shows downtown.', action: null };
    }
    if (source === 'default') {
        if (permission === 'granted') {
            return { text: 'Showing downtown Calgary until your location is found.', action: 'retry' };
        }
        if (Platform.OS === 'web') {
            return { text: 'Showing downtown Calgary. Allow location in your browser to see parking near you.', action: null };
        }
        return {
            text: 'Showing downtown Calgary. Turn on location to see parking near you.',
            action: permission === 'blocked' ? 'settings' : 'ask',
        };
    }
    return null;
}
