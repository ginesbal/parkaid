import { REMINDER_IDS, buildSessionReminders } from '../sessionReminders';

const NOW = new Date('2026-10-21T14:00:00').getTime();
const min = (n) => n * 60000;
const SESSION = {
    locationName: '6 Av SW',
    spotId: 'Zone 1684',
    walkMinutes: 2,
    scheduledEnd: new Date(NOW + min(60)).toISOString(),
};

describe('buildSessionReminders', () => {
    it('reminds to head back, then that time is up', () => {
        const [headBack, timesUp] = buildSessionReminders(SESSION, 12, NOW);
        expect(headBack.id).toBe(REMINDER_IDS.headBack);
        expect(headBack.date.getTime()).toBe(NOW + min(48));
        expect(headBack.title).toBe('Time to head back');
        expect(headBack.body).toMatch(/^Your parking at 6 Av SW ends at .+\. It’s about a 2 minute walk\.$/);
        expect(timesUp.id).toBe(REMINDER_IDS.timesUp);
        expect(timesUp.date.getTime()).toBe(NOW + min(60));
        expect(timesUp.body).toMatch(/Move your car, or add time in ParkPlus for zone 1684\.$/);
    });

    it('leaves out a reminder that is already past', () => {
        const reminders = buildSessionReminders(SESSION, 70, NOW);
        expect(reminders.map((r) => r.id)).toEqual([REMINDER_IDS.timesUp]);
        expect(buildSessionReminders(SESSION, 12, NOW + min(61))).toEqual([]);
    });

    it('does without a walk or a zone when the spot has none', () => {
        const lot = { ...SESSION, spotId: 'Parkade', walkMinutes: null };
        const [headBack, timesUp] = buildSessionReminders(lot, 12, NOW);
        expect(headBack.body).toMatch(/^Your parking at 6 Av SW ends at .+\.$/);
        expect(timesUp.body).toMatch(/add time where you paid\.$/);
    });

    it('does without a name when the driver parked somewhere else', () => {
        const elsewhere = { ...SESSION, locationName: null, spotId: null, walkMinutes: null };
        const [headBack, timesUp] = buildSessionReminders(elsewhere, 12, NOW);
        expect(headBack.body).toMatch(/^Your parking ends at .+\.$/);
        expect(timesUp.body).toMatch(/^Your parking ended at .+\. Move your car, or add time where you paid\.$/);
    });

    it('has nothing to say without a session', () => {
        expect(buildSessionReminders(null, 12, NOW)).toEqual([]);
        expect(buildSessionReminders({ scheduledEnd: 'not a date' }, 12, NOW)).toEqual([]);
    });
});
