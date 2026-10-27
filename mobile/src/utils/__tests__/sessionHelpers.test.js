import { calculateSessionState, formatDuration, formatRemaining, getWarnAtMinutes } from '../sessionHelpers';
import { getGreeting } from '../greeting';
import { durationsFor, snapDuration, startBlocker } from '../../screens/SessionScreen/components/EmptyState/SetupCard';

describe('formatRemaining', () => {
    it('says time left the way people do', () => {
        expect(formatRemaining(54 * 60000 + 30000)).toBe('54 min');
        expect(formatRemaining(114 * 60000)).toBe('1 hour 54 min');
        expect(formatRemaining(120 * 60000)).toBe('2 hours');
        expect(formatRemaining(30000)).toBe('Less than a minute');
        expect(formatRemaining(0)).toBe('Time’s up');
    });
});

describe('formatDuration', () => {
    it('formats minutes', () => {
        expect(formatDuration(30)).toBe('30 min');
        expect(formatDuration(90)).toBe('1 hour 30 min');
    });

    it('spells out hours, singular and plural', () => {
        expect(formatDuration(60)).toBe('1 hour');
        expect(formatDuration(180)).toBe('3 hours');
        expect(formatDuration(150)).toBe('2 hours 30 min');
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

describe('getWarnAtMinutes', () => {
    it('is the walk back plus the buffer on normal sessions', () => {
        expect(getWarnAtMinutes(4, 120)).toBe(14);
        expect(getWarnAtMinutes(null, 120)).toBe(15);
    });

    it('never warns for most of a short session', () => {
        // A 10 minute zone, 2 minutes away: warn with 5 left, not from the start.
        expect(getWarnAtMinutes(2, 10)).toBe(5);
        // A long walk still gets at least the walk plus a minute.
        expect(getWarnAtMinutes(8, 10)).toBe(9);
    });
});

describe('durationsFor', () => {
    it('offers durations within the posted maximum, and the maximum itself', () => {
        expect(durationsFor(120).map((d) => d.value)).toEqual([30, 60, 120]);
        expect(durationsFor(90).map((d) => d.value)).toEqual([30, 60, 90]);
        expect(durationsFor(45).map((d) => d.value)).toEqual([30, 45]);
        expect(durationsFor(null).map((d) => d.value)).toEqual([30, 60, 120, 180]);
    });

    it('offers the maximum itself when even 30 minutes is too long', () => {
        expect(durationsFor(20).map((d) => d.value)).toEqual([20]);
    });
});

describe('snapDuration', () => {
    it('keeps the choice on an offered option', () => {
        const opts = durationsFor(90); // 30, 60, 90
        expect(snapDuration(opts, 60)).toBe(60);
        expect(snapDuration(opts, 120)).toBe(90);
        expect(snapDuration(opts, 45)).toBe(30);
        expect(snapDuration(durationsFor(20), 60)).toBe(20);
    });
});

describe('startBlocker', () => {
    it('says what is missing before Start, place first', () => {
        expect(startBlocker({ plate: '', needsPlace: true })).toBe('Pick where you parked and add your plate to start.');
        expect(startBlocker({ plate: 'CVX 4821', needsPlace: true })).toBe('Pick where you parked to start.');
        expect(startBlocker({ plate: '  ', needsPlace: false })).toBe('Add your plate to start.');
    });

    it('is nothing once both are there', () => {
        expect(startBlocker({ plate: 'CVX 4821', needsPlace: false })).toBeNull();
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
