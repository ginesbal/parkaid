import { formatRestrictions, nextRestriction, parseRestrictions, restrictionAt } from '../restrictions';
import {
    getCaution,
    getNowLine,
    getStayLimit,
    pickTopSpot,
    rankSpots,
} from '../spotPresentation';
import { setupLimit } from '../../screens/SessionScreen/components/EmptyState/SetupCard';

// Local times; 2026-10-19 is a Monday, the 24th a Saturday.
const at = (day, hhmm) => new Date(`2026-10-${day}T${hhmm}:00`);
const clock = (date) => [date.getDate(), date.getHours(), date.getMinutes()];
const words = (text) => text.replace(/[  ]/g, ' ').replace(/⁠/g, '');

// 6 Av SW from 8 St to 9 St (zone 1684), as the City has it.
const block = (over = {}) => ({
    id: 's1',
    spot_type: 'on_street',
    address: '6 Av SW ,  Fr 8 St SW To 9 St SW',
    distance: 140,
    walkingTime: 2,
    price_per_hour: 2,
    max_duration_minutes: 120,
    zone_info: {
        parking_zone: '1684',
        enforceable_time: '0910-1520 MON-FRI',
        parking_restrict_type: 'AM&PM',
        parking_restrict_time: '07:00 - 08:30 , 15:30 - 18:00',
    },
    ...over,
});

describe('parseRestrictions', () => {
    it('reads every way the City writes them, on weekdays', () => {
        expect(parseRestrictions('07:00 - 08:30 , 15:30 - 18:00')).toEqual([
            { days: [1, 2, 3, 4, 5], from: 420, to: 510 },
            { days: [1, 2, 3, 4, 5], from: 930, to: 1080 },
        ]);
        expect(parseRestrictions('15:30 -18:00')).toEqual([{ days: [1, 2, 3, 4, 5], from: 930, to: 1080 }]);
        expect(parseRestrictions('06:00 -08:00')[0]).toMatchObject({ from: 360, to: 480 });
    });

    it('reads nothing into "none", gaps or text it does not know', () => {
        expect(parseRestrictions(null)).toBeNull();
        expect(parseRestrictions('none')).toBeNull();
        expect(parseRestrictions('Rush hour')).toBeNull();
        expect(parseRestrictions('18:00 - 07:00')).toBeNull();
    });

    it('says the times the way people do', () => {
        expect(words(formatRestrictions(parseRestrictions('07:00 - 08:30 , 15:30 - 18:00'))))
            .toBe('7–8:30 AM and 3:30–6 PM');
        expect(words(formatRestrictions(parseRestrictions('06:30 - 08:30 , 16:00 - 18:00'))))
            .toBe('6:30–8:30 AM and 4–6 PM');
        expect(words(formatRestrictions(parseRestrictions('11:30 - 13:00')))).toBe('11:30 AM–1 PM');
    });
});

describe('when a restriction applies', () => {
    const rush = parseRestrictions('07:00 - 08:30 , 15:30 - 18:00');

    it('knows one is on, weekdays only', () => {
        expect(clock(restrictionAt(rush, at(20, '15:40')).end)).toEqual([20, 18, 0]);
        expect(restrictionAt(rush, at(20, '15:29'))).toBeNull();
        expect(restrictionAt(rush, at(20, '18:00'))).toBeNull();
        expect(restrictionAt(rush, at(24, '15:40'))).toBeNull(); // Saturday
    });

    it('finds the next one, past the weekend', () => {
        expect(clock(nextRestriction(rush, at(20, '14:40')).start)).toEqual([20, 15, 30]);
        expect(clock(nextRestriction(rush, at(20, '19:00')).start)).toEqual([21, 7, 0]);
        expect(clock(nextRestriction(rush, at(23, '19:00')).start)).toEqual([26, 7, 0]); // Friday to Monday
        expect(nextRestriction(null, at(20, '14:40'))).toBeNull();
    });
});

describe('a block with a rush-hour restriction', () => {
    it('limits the stay to the restriction when it comes first', () => {
        expect(getStayLimit(block(), at(20, '13:40'))).toMatchObject({ minutes: 110, reason: 'restriction' });
        expect(getStayLimit(block(), at(20, '10:00'))).toEqual({ minutes: 120, reason: 'max' });
        expect(getStayLimit(block(), at(20, '15:40'))).toMatchObject({ minutes: 0, reason: 'restricted' });
        expect(getStayLimit(block({ zone_info: {} }), at(20, '13:40'))).toEqual({ minutes: 120, reason: 'max' });
    });

    it('says so in amber on the lists, most pressing first', () => {
        expect(words(getCaution(block(), at(20, '15:40')))).toBe('No parking until 6:00 PM');
        expect(words(getCaution(block(), at(20, '13:40')))).toBe('No parking from 3:30 PM');
        expect(getCaution(block(), at(20, '10:00'))).toBeNull();
        expect(words(getCaution(block({ max_duration_minutes: 20 }), at(20, '10:00')))).toBe('20 min max');
    });

    it('never calls a restricted hour free', () => {
        expect(getNowLine(block(), at(20, '15:40'))).toEqual({ tone: 'warning', text: expect.stringMatching(/^No parking now · until 6:00.PM$/) });
        expect(words(getNowLine(block(), at(20, '15:25')).text)).toBe('Free now · no parking from 3:30 PM');
        expect(words(getNowLine(block(), at(20, '19:00')).text)).toBe('Free now · no parking from 7:00 AM Wed');
        expect(words(getNowLine(block(), at(20, '14:00')).text)).toBe('No parking from 3:30 PM');
        expect(getNowLine(block(), at(20, '10:00'))).toBeNull();
        // Saturday: free here all weekend, but the car must move before Monday's rush hour
        expect(words(getNowLine(block(), at(24, '12:00')).text)).toBe('Free now · no parking from 7:00 AM Mon');
        const plain = block({ zone_info: { enforceable_time: '0910-1520 MON-FRI' } });
        expect(words(getNowLine(plain, at(24, '12:00')).text)).toBe('Free now · charged from 9:10 AM Mon');
    });

    it('ranks it after open blocks while restricted, and never suggests it', () => {
        const open = block({ id: 'open', walkingTime: 4, distance: 300, zone_info: { enforceable_time: '0910-1750 MON-SAT' } });
        const permit = { id: 'permit', spot_type: 'residential', walkingTime: 1, distance: 60 };
        const now = at(20, '15:40');
        expect(rankSpots([block(), open, permit], 'all', now).map((s) => s.id)).toEqual(['open', 's1', 'permit']);
        expect(pickTopSpot([block(), open], 'all', now).id).toBe('open');
        expect(pickTopSpot([block()], 'all', now)).toBeNull();
        // Restricted from 3:30: less than an hour at 2:40, so after a block with more
        expect(rankSpots([block(), open], 'all', at(20, '14:40')).map((s) => s.id)).toEqual(['open', 's1']);
    });
});

describe('setupLimit', () => {
    it('offers durations up to the restriction, and says why', () => {
        const limit = setupLimit(getStayLimit(block(), at(20, '14:40')));
        expect(limit.maxMinutes).toBe(50);
        expect(words(limit.note)).toBe('No parking from 3:30 PM, so the longest here is 50 min.');
        expect(limit.noParkingUntil).toBeNull();
    });

    it('offers nothing while parking is not allowed, or about to stop', () => {
        expect(clock(setupLimit(getStayLimit(block(), at(20, '15:40'))).noParkingUntil)).toEqual([20, 18, 0]);
        expect(clock(setupLimit(getStayLimit(block(), at(20, '15:27'))).noParkingUntil)).toEqual([20, 18, 0]);
    });

    it('leaves the durations alone when the restriction is hours away', () => {
        const limit = setupLimit(getStayLimit(block({ max_duration_minutes: null }), at(20, '10:00')));
        expect(limit).toEqual({ maxMinutes: null, note: null, noParkingUntil: null });
        expect(words(setupLimit(getStayLimit(block(), at(20, '10:00'))).note)).toBe('2 hour maximum here. Check posted signs.');
    });
});

describe('getExtendLimit', () => {
    const { getExtendLimit } = require('../sessionHelpers');
    const session = (over = {}) => ({
        duration: 50,
        maxDuration: 120,
        scheduledEnd: at(20, '15:30').toISOString(),
        noParking: '07:00 - 08:30 , 15:30 - 18:00',
        ...over,
    });

    it('stops Add at a restriction that starts when the session ends', () => {
        expect(getExtendLimit(session())).toMatchObject({ minutes: 0, reason: 'restriction' });
        expect(clock(getExtendLimit(session()).at)).toEqual([20, 15, 30]);
    });

    it('leaves room up to the restriction, or the posted maximum if that comes first', () => {
        expect(getExtendLimit(session({ scheduledEnd: at(20, '15:10').toISOString() })))
            .toMatchObject({ minutes: 20, reason: 'restriction' });
        expect(getExtendLimit(session({ scheduledEnd: at(20, '11:00').toISOString(), duration: 90 })))
            .toEqual({ minutes: 30, reason: 'max', at: null });
        expect(getExtendLimit(session({ noParking: null, maxDuration: null })))
            .toEqual({ minutes: null, reason: null, at: null });
    });
});
