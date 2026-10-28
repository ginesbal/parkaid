import { getMarkerDescription, getMarkerKind, getPillLabel } from '../SpotPill';

// A rate all day, every day (see utils/rates).
const rates = (rate) => ({ periods: [{ days: [0, 1, 2, 3, 4, 5, 6], from: 0, to: 1440, rate, dayMax: null }] });
// Local times; 2026-10-20 is a Tuesday.
const DAY = new Date('2026-10-20T13:40:00');
const EVENING = new Date('2026-10-20T19:00:00');

const street = { spot_type: 'on_street', rates: rates(6), zone_info: { enforceable_time: '0910-1750 MON-SAT' } };
const unpriced = { spot_type: 'on_street', rates: null, zone_info: { enforceable_time: '0910-1750 MON-SAT' } };
const lot = { spot_type: 'off_street' };
const permit = { spot_type: 'residential' };

describe('map markers', () => {
    it('tells priced street, unpriced street, lot and permit apart', () => {
        expect([street, unpriced, lot, permit].map((s) => getMarkerKind(s, DAY))).toEqual(['priced', 'street', 'lot', 'permit']);
    });

    it('labels the rate now, free when the City isn\'t charging', () => {
        expect(getPillLabel(street, DAY)).toBe('$6');
        expect(getPillLabel({ ...street, rates: rates(2.25) }, DAY)).toBe('$2.25');
        expect(getPillLabel(street, EVENING)).toBe('Free');
        expect(getPillLabel(unpriced, EVENING)).toBe('Free');
        expect(getPillLabel(unpriced, DAY)).toBeNull();
        expect(getPillLabel(lot, DAY)).toBeNull();
    });

    it('reads each kind aloud', () => {
        expect(getMarkerDescription(street, DAY)).toBe('$6.00 per hour');
        expect(getMarkerDescription(street, EVENING)).toBe('Free now');
        expect(getMarkerDescription(unpriced, DAY)).toBe('Check posted signs');
        expect(getMarkerDescription(lot, DAY)).toBe('Rates posted at lot');
        expect(getMarkerDescription(permit, DAY)).toBe('Permit holders only');
    });
});
