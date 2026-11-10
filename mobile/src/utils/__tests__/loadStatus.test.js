import { describeSaved, getLoadError } from '../loadStatus';

const NOW = new Date('2026-10-19T14:30:00').getTime();
const AT_2_10 = new Date('2026-10-19T14:10:00').getTime();

describe('loadStatus', () => {
    it('names each failure plainly, never with a status code', () => {
        expect(getLoadError('offline').title).toBe('No connection');
        expect(getLoadError('timeout').title).toBe('Parking data is slow to answer');
        expect(getLoadError('server').title).toBe('Parking data isn’t available');
        expect(getLoadError('HTTP 500')).toBe(getLoadError('server'));
    });

    it('says nothing about a fresh list', () => {
        expect(describeSaved({ savedAt: NOW - 60000, now: NOW })).toBeNull();
        expect(describeSaved({ savedAt: null, now: NOW })).toBeNull();
        expect(describeSaved({ savedAt: NOW - 60000, updating: true, now: NOW })).toBe('Updating…');
    });

    it('says when an older list was saved, and why it was kept', () => {
        expect(describeSaved({ savedAt: AT_2_10, now: NOW })).toMatch(/^Saved 2:10\sPM$/);
        expect(describeSaved({ savedAt: AT_2_10, updating: true, now: NOW })).toMatch(/^Saved 2:10\sPM · Updating…$/);
        expect(describeSaved({ savedAt: NOW - 60000, stale: 'offline', now: NOW })).toMatch(/^Offline · saved 2:29\sPM$/);
        expect(describeSaved({ savedAt: AT_2_10, stale: 'timeout', now: NOW })).toMatch(/^No answer · saved 2:10\sPM$/);
    });
});
