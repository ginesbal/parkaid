import { getMarkerDescription, getMarkerKind, getPillLabel } from '../SpotPill';

const street = { spot_type: 'on_street', price_per_hour: 6 };
const unpriced = { spot_type: 'on_street', price_per_hour: 0 };
const lot = { spot_type: 'off_street', price_per_hour: 0 };
const permit = { spot_type: 'residential', price_per_hour: 0 };

describe('map markers', () => {
    it('tells priced street, unpriced street, lot and permit apart', () => {
        expect([street, unpriced, lot, permit].map(getMarkerKind)).toEqual(['priced', 'street', 'lot', 'permit']);
    });

    it('labels only a known rate as a price', () => {
        expect(getPillLabel(street)).toBe('$6');
        expect(getPillLabel({ ...street, price_per_hour: 2.25 })).toBe('$2.25');
        expect(getPillLabel(lot)).toBeNull();
    });

    it('reads each kind aloud', () => {
        expect(getMarkerDescription(street)).toBe('$6.00 per hour');
        expect(getMarkerDescription(unpriced)).toBe('Check posted signs');
        expect(getMarkerDescription(lot)).toBe('Rates posted at lot');
        expect(getMarkerDescription(permit)).toBe('Permit holders only');
    });
});
