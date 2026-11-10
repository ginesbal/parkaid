import { describeLocation, distanceMeters, isInCalgary } from '../geo';

const DOWNTOWN = { latitude: 51.0447, longitude: -114.0719 };

describe('geo', () => {
    it('measures distance in metres', () => {
        const north = { latitude: 51.0547, longitude: -114.0719 };
        expect(Math.round(distanceMeters(DOWNTOWN, north))).toBe(1112);
    });

    it('knows Calgary from elsewhere', () => {
        expect(isInCalgary({ latitude: 51.08, longitude: -114.13 })).toBe(true); // University
        expect(isInCalgary({ latitude: 53.5461, longitude: -113.4938 })).toBe(false); // Edmonton
    });

    it('says nothing about a fix from now', () => {
        expect(describeLocation({ source: 'gps' })).toBeNull();
    });

    it('names a saved place by when it was taken', () => {
        const now = new Date('2026-10-21T15:00:00').getTime();
        const today = describeLocation({ source: 'saved', savedAt: new Date('2026-10-21T14:10:00').getTime(), now });
        expect(today.text).toMatch(/^Using your location from 2:10\sPM\.$/);
        expect(today.action).toBe('retry');
        const before = describeLocation({ source: 'saved', savedAt: new Date('2026-10-19T09:00:00').getTime(), now });
        expect(before.text).toBe('Using your location from Oct 19.');
    });

    it('says why it shows downtown, and what would change that', () => {
        expect(describeLocation({ source: 'outside' })).toEqual({ text: 'You’re outside Calgary, so this shows downtown.', action: null });
        expect(describeLocation({ source: 'default', permission: 'denied' }).action).toBe('ask');
        expect(describeLocation({ source: 'default', permission: 'blocked' }).action).toBe('settings');
        expect(describeLocation({ source: 'default', permission: 'granted' }).action).toBe('retry');
    });
});

describe('nearestSpot', () => {
    const { nearestSpot } = require('../geo');
    const at = (id, latitude, longitude) => ({ id, coordinates: { type: 'Point', coordinates: [longitude, latitude] } });
    const spots = [at('a', 51.0447, -114.0719), at('b', 51.0449, -114.0719), at('c', 51.05, -114.08)];

    it('picks the closest pin within reach of a tap', () => {
        expect(nearestSpot(spots, { latitude: 51.04485, longitude: -114.0719 }, 30).id).toBe('b');
    });

    it('picks nothing when no pin is within reach', () => {
        expect(nearestSpot(spots, { latitude: 51.047, longitude: -114.0719 }, 30)).toBeNull();
        expect(nearestSpot([], { latitude: 51.0447, longitude: -114.0719 }, 30)).toBeNull();
    });
});
