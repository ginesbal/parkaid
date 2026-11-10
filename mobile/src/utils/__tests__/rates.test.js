import { parseChargeHours } from '../chargeHours';
import { nextRateChange, periodAt, periodsCost, sessionCost, sessionRateAt } from '../rates';

// Local times; 2026-10-20 is a Tuesday.
const at = (day, hhmm) => new Date(`2026-10-${day}T${hhmm}:00`);
const WEEKDAYS = [1, 2, 3, 4, 5];

// Zone 1008 (Eau Claire Av SW, 4 to 5 St), as the City has it.
const EAU_CLAIRE = [
    { days: WEEKDAYS, from: 540, to: 660, rate: 3.75, dayMax: null },
    { days: WEEKDAYS, from: 660, to: 810, rate: 4.25, dayMax: null },
    { days: WEEKDAYS, from: 810, to: 930, rate: 3.25, dayMax: null },
    { days: WEEKDAYS, from: 930, to: 1080, rate: 2.25, dayMax: null },
    { days: [6], from: 540, to: 1080, rate: 1, dayMax: null },
    { days: [0], from: 0, to: 1440, rate: 0, dayMax: null },
];
const CHARGED = parseChargeHours('0910-1750 MON-SAT');

describe('periodsCost', () => {
    it('prices each minute at the rate then', () => {
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(20, '10:00'), 60)).toBe(3.75);
        // 30 min at $4.25, then 30 at $3.25
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(20, '13:00'), 60)).toBe(3.75);
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(24, '12:00'), 120)).toBe(2); // Saturday
    });

    it('charges only while the City does', () => {
        // Free until 9:10, then 30 min at $3.75 an hour
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(20, '08:40'), 60)).toBe(1.88);
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(20, '18:00'), 120)).toBe(0);
        expect(periodsCost(EAU_CLAIRE, CHARGED, at(25, '12:00'), 60)).toBe(0); // Sunday
    });

    it('stops at the most a day can cost', () => {
        const longStay = [{ days: WEEKDAYS, from: 0, to: 1440, rate: 1.5, dayMax: 6 }];
        const hours = parseChargeHours('0910-1750 MON-FRI');
        expect(periodsCost(longStay, hours, at(20, '09:10'), 180)).toBe(4.5);
        expect(periodsCost(longStay, hours, at(20, '09:10'), 480)).toBe(6);
    });

    it('prices nothing when a charged minute has no known rate', () => {
        const morningOnly = [{ days: WEEKDAYS, from: 540, to: 660, rate: 2, dayMax: null }];
        expect(periodsCost(morningOnly, CHARGED, at(20, '10:30'), 60)).toBeNull();
        expect(periodsCost(null, CHARGED, at(20, '10:30'), 60)).toBeNull();
    });
});

describe('nextRateChange', () => {
    it('finds the next change in the charged rate', () => {
        const change = nextRateChange(EAU_CLAIRE, CHARGED, at(20, '10:40'), 60);
        expect(change.rate).toBe(4.25);
        expect(change.at.getHours()).toBe(11);
        expect(nextRateChange(EAU_CLAIRE, CHARGED, at(20, '17:30'), 60)).toMatchObject({ rate: 0 });
        expect(nextRateChange(EAU_CLAIRE, CHARGED, at(20, '10:00'), 30)).toBeNull();
    });

    it('finds the period for a moment', () => {
        expect(periodAt(EAU_CLAIRE, at(20, '13:29')).rate).toBe(4.25);
        expect(periodAt(EAU_CLAIRE, at(20, '13:30')).rate).toBe(3.25);
        expect(periodAt(EAU_CLAIRE, at(20, '06:00'))).toBeNull();
    });
});

describe('a session\'s price', () => {
    const session = {
        startedAt: at(20, '10:40').toISOString(),
        hourlyRate: 3.75,
        ratePeriods: EAU_CLAIRE,
        chargeHours: '0910-1750 MON-SAT',
    };

    it('follows the City\'s rates as they change', () => {
        // 20 min at $3.75, then 40 at $4.25
        expect(sessionCost(session, at(20, '10:40'), 60)).toBe(4.08);
        expect(sessionRateAt(session, at(20, '11:30'))).toBe(4.25);
        expect(sessionRateAt(session, at(20, '18:30'))).toBe(0);
    });

    it('keeps an older saved session\'s one rate', () => {
        const older = { hourlyRate: 6, chargeHours: '0910-1750 MON-SAT' };
        expect(sessionCost(older, at(20, '10:40'), 60)).toBe(6);
        expect(sessionRateAt(older, at(20, '11:30'))).toBe(6);
    });
});
