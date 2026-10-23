import {
    chargedCost,
    chargedMinutes,
    describeFreeNow,
    isChargedAt,
    nextChargedAt,
    parseChargeHours,
} from '../chargeHours';

// Local times; 2026-10-19 is a Monday.
const at = (day, hhmm) => new Date(`2026-10-${day}T${hhmm}:00`).getTime();
const CITY = parseChargeHours('0910-1750 MON-SAT, 0001-2359 SUN');

describe('chargeHours', () => {
    it('reads the City format, all day included', () => {
        expect(CITY).toEqual([
            { days: [1, 2, 3, 4, 5, 6], from: 550, to: 1070 },
            { days: [0], from: 0, to: 1440 },
        ]);
    });

    it('reads nothing it does not understand, so nothing becomes free', () => {
        expect(parseChargeHours(null)).toBeNull();
        expect(parseChargeHours('Mon to Fri, daytime')).toBeNull();
        expect(parseChargeHours('1800-0200 FRI-SAT')).toBeNull();
        expect(isChargedAt(null, at(19, '03:00'))).toBe(true);
        expect(chargedMinutes(null, at(19, '03:00'), 60)).toBe(60);
    });

    it('knows when parking is charged', () => {
        expect(isChargedAt(CITY, at(19, '09:09'))).toBe(false);
        expect(isChargedAt(CITY, at(19, '09:10'))).toBe(true);
        expect(isChargedAt(CITY, at(19, '17:50'))).toBe(false);
        expect(isChargedAt(CITY, at(25, '23:30'))).toBe(true); // Sunday, all day
    });

    it('prices only the charged minutes', () => {
        expect(chargedMinutes(CITY, at(19, '08:40'), 60)).toBe(30);
        expect(chargedCost(6, CITY, at(19, '08:40'), 60)).toBe(3);
        expect(chargedCost(6, CITY, at(19, '18:00'), 120)).toBe(0);
        expect(chargedCost(null, CITY, at(19, '12:00'), 60)).toBeNull();
    });

    it('says when charging starts again', () => {
        expect(nextChargedAt(CITY, at(19, '07:00')).getTime()).toBe(at(19, '09:10'));
        expect(nextChargedAt(CITY, at(19, '18:00')).getTime()).toBe(at(20, '09:10'));
        expect(describeFreeNow(CITY, at(19, '07:00'))).toMatch(/^Free now · charged from 9:10\sAM$/);
        expect(describeFreeNow(CITY, at(19, '18:00'))).toMatch(/^Free now · charged from 9:10\sAM Tue$/);
        expect(describeFreeNow(CITY, at(19, '12:00'))).toBeNull();
    });
});
