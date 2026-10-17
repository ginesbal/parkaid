import { calculateSessionState, formatDuration, formatRemaining } from '../sessionHelpers';
import { getGreeting } from '../greeting';
import { durationsFor } from '../../screens/SessionScreen/components/EmptyState/SetupCard';

describe('formatRemaining', () => {
    it('says time left the way people do', () => {
        expect(formatRemaining(54 * 60000 + 30000)).toBe('54 min');
        expect(formatRemaining(114 * 60000)).toBe('1 h 54 min');
        expect(formatRemaining(120 * 60000)).toBe('2 h');
        expect(formatRemaining(30000)).toBe('Less than a minute');
        expect(formatRemaining(0)).toBe('Time’s up');
    });
});

describe('formatDuration', () => {
    it('formats minutes', () => {
        expect(formatDuration(30)).toBe('30 min');
        expect(formatDuration(90)).toBe('1 h 30 min');
    });
});

describe('calculateSessionState', () => {
    it('warns when the walk back plus a buffer is all that is left', () => {
        // 4 minute walk + 10 minute buffer
        expect(calculateSessionState(15, 14)).toBe('active');
        expect(calculateSessionState(14, 14)).toBe('expiring');
        expect(calculateSessionState(1, 14)).toBe('expiring');
        expect(calculateSessionState(0, 14)).toBe('expired');
    });
});

describe('durationsFor', () => {
    it('offers only durations within the posted maximum', () => {
        expect(durationsFor(120).map((d) => d.value)).toEqual([30, 60, 120]);
        expect(durationsFor(null).map((d) => d.value)).toEqual([30, 60, 120, 180]);
    });

    it('offers the maximum itself when even 30 minutes is too long', () => {
        expect(durationsFor(20).map((d) => d.value)).toEqual([20]);
    });
});

describe('getGreeting', () => {
    const at = (h) => new Date(2026, 9, 17, h, 0);
    it('follows the time of day', () => {
        expect(getGreeting(at(8)).hello).toBe('Good morning.');
        expect(getGreeting(at(13)).hello).toBe('Good afternoon.');
        expect(getGreeting(at(19)).ask).toBe('Where to tonight?');
        expect(getGreeting(at(2)).hello).toBe('Out late?');
    });
});
