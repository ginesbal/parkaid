import {
    formatEnforceableTime,
    getCrossStreets,
    getMaxStayLabel,
    getRateDisplay,
    getRowMeta,
    getShortLimit,
    getSpotKind,
    getSpotName,
    getZoneLabel,
    isCovered,
    pickTopSpot,
    sortByValue,
    tidyName,
} from '../spotPresentation';

// Shapes follow backend/routes/parking.js and City of Calgary open data.
const street = (over = {}) => ({
    id: 's',
    spot_type: 'on_street',
    address: 'Eau Claire Av SW ,  Fr 4 St SW To 5 St SW',
    distance: 200,
    zone_info: { parking_zone: '1008', enforceable_time: '0910-1750 MON-SAT' },
    price: 5,
    price_per_hour: 5,
    max_duration_minutes: 180,
    ...over,
});

describe('getSpotName', () => {
    it('reads a permit block as its street and block', () => {
        expect(getSpotName({ spot_type: 'residential', address: '00 Block 6 AV SW' }))
            .toEqual({ title: '6 Ave SW', detail: 'Addresses 0–99' });
        expect(getSpotName({ spot_type: 'residential', address: '1200 Block COLLINGWOOD PL NW' }))
            .toEqual({ title: 'Collingwood Pl NW', detail: 'Addresses 1200–1299' });
    });

    it('puts shouted names in title case, keeping quadrants and acronyms', () => {
        expect(getSpotName({ address: 'CPA LOT 11: 640 7TH AV SW' }))
            .toEqual({ title: 'CPA Lot 11', detail: '640 7 Ave SW' });
        expect(tidyName('WINDSOR Cr SW')).toBe('Windsor Cres SW');
        expect(tidyName('2A ST SE')).toBe('2A St SE');
        expect(tidyName('Seton YMCA')).toBe('Seton YMCA');
    });

    it('writes the City’s street-type codes the way people do', () => {
        expect(tidyName('Eau Claire Av SW')).toBe('Eau Claire Ave SW');
        expect(tidyName('MacLeod Tr. SE')).toBe('MacLeod Trail SE');
        expect(tidyName('Olympic Wy SE')).toBe('Olympic Way SE');
        expect(tidyName('MONTGOMERY BV NW')).toBe('Montgomery Blvd NW');
        expect(tidyName('Barclay Pr SW')).toBe('Barclay Parade SW');
        expect(tidyName('Kensington Rd')).toBe('Kensington Rd');
        expect(tidyName('Centre St S')).toBe('Centre St S');
        expect(tidyName('313 10 Av Se')).toBe('313 10 Ave SE');
        // "St" for Saint is not a street type
        expect(tidyName('ST MATTHEW SQ NE')).toBe('St Matthew Sq NE');
    });

    it('drops the ordinal from numbered streets', () => {
        expect(getSpotName({ address: 'CPA Lot 28: 455 6th St SW' }).detail).toBe('455 6 St SW');
        expect(getSpotName({ address: 'City Centre: 300 7th Avenue SW' }).detail).toBe('300 7 Ave SW');
        expect(getSpotName({ address: 'Lot 9: 120 Riverfront Ave SE' }).detail).toBe('120 Riverfront Ave SE');
        expect(getSpotName({ address: 'Eau Claire Av SW ,  Fr 4 St SW To 5 St SW' }).detail).toBe('4 St SW to 5 St SW');
    });

    it('splits a block face into street and cross streets', () => {
        expect(getSpotName(street())).toEqual({ title: 'Eau Claire Ave SW', detail: '4 St SW to 5 St SW' });
    });

    it('splits a lot name from its address', () => {
        expect(getSpotName({ address: 'CPA Lot 24: 825 Macleod Trail SE' }))
            .toEqual({ title: 'CPA Lot 24', detail: '825 Macleod Trail SE' });
    });

    it('falls back to the kind when the address is unknown', () => {
        expect(getSpotName({ spot_type: 'off_street', address: 'Unknown Address' }).title).toBe('Lot');
    });
});

describe('row lines', () => {
    const lot = { spot_type: 'off_street', address: 'CPA Lot 28: 455 6th St SW', metadata: { parking_type: 'PARKADE' }, walkingTime: 4 };
    const permit = { spot_type: 'residential', address: '00 Block 6 AV SW', walkingTime: 2 };

    it('names a block by its cross streets, without repeating the quadrant', () => {
        expect(getCrossStreets(street())).toBe('4 St to 5 St');
        expect(getCrossStreets(street({ address: '3 Av SW ,  Fr Centre St S To 1 St SW' }))).toBe('Centre St S to 1 St');
        expect(getCrossStreets(lot)).toBeNull();
    });

    it('calls out a maximum stay under 2 hours, kept on one line', () => {
        expect(getShortLimit(street({ max_duration_minutes: 20 }))).toBe('20 min max');
        expect(getShortLimit(street({ max_duration_minutes: 60 }))).toBe('1 hour max');
        expect(getShortLimit(street({ max_duration_minutes: 120 }))).toBeNull();
        expect(getShortLimit(lot)).toBeNull();
    });

    it('describes a row by its block and walk, or its kind and walk', () => {
        expect(getRowMeta(street({ walkingTime: 3 }))).toBe('4 St to 5 St · 3 min walk');
        expect(getRowMeta(lot)).toBe('Parkade · 4 min walk');
        expect(getRowMeta(permit)).toBe('Permit zone · 2 min walk');
    });
});

describe('rates', () => {
    it('shows a known hourly rate', () => {
        expect(getRateDisplay(street())).toEqual({ amount: '$5.00', unit: '/ hour' });
    });

    it('never calls an unknown rate free', () => {
        expect(getRateDisplay(street({ price: 0, price_per_hour: 0 })).note).toBe('Check posted signs');
        expect(getRateDisplay({ spot_type: 'off_street', price: 0 }).note).toBe('Rates posted at lot');
        expect(getRateDisplay({ spot_type: 'residential', price: 0 }).note).toBe('Permit holders only');
    });

    it('sorts by known rate, unknown last, ties by distance', () => {
        const sorted = sortByValue([
            street({ id: 'unknown', price: 0, price_per_hour: 0, distance: 10 }),
            street({ id: 'six', price: 6, price_per_hour: 6, distance: 50 }),
            street({ id: 'two-far', price: 2, price_per_hour: 2, distance: 400 }),
            street({ id: 'two-near', price: 2, price_per_hour: 2, distance: 100 }),
        ]);
        expect(sorted.map((s) => s.id)).toEqual(['two-near', 'two-far', 'six', 'unknown']);
    });
});

describe('kinds and zones', () => {
    it('only calls parkades covered', () => {
        expect(isCovered({ spot_type: 'off_street', metadata: { parking_type: 'PARKADE' } })).toBe(true);
        expect(isCovered({ spot_type: 'off_street', metadata: { parking_type: 'SURFACE LOT' } })).toBe(false);
        expect(getSpotKind({ spot_type: 'off_street', metadata: { parking_type: 'SURFACE LOT' } })).toBe('Surface lot');
    });

    it('gives the ParkPlus zone for street parking only', () => {
        expect(getZoneLabel(street())).toBe('Zone 1008');
        expect(getZoneLabel({ spot_type: 'residential', zone_info: { parking_zone: 'AA' } })).toBeNull();
    });
});

describe('pickTopSpot', () => {
    it('skips permit-only blocks unless asked for them', () => {
        const permit = { id: 'p', spot_type: 'residential' };
        const paid = street({ id: 'paid' });
        expect(pickTopSpot([permit, paid]).id).toBe('paid');
        expect(pickTopSpot([permit, paid], 'residential').id).toBe('p');
        expect(pickTopSpot([permit]).id).toBe('p');
        expect(pickTopSpot([])).toBeNull();
    });

    it('skips a block with a maximum under an hour while there is another', () => {
        const brief = street({ id: 'brief', max_duration_minutes: 10 });
        const paid = street({ id: 'paid' });
        expect(pickTopSpot([brief, paid]).id).toBe('paid');
        expect(pickTopSpot([brief]).id).toBe('brief');
    });
});

describe('time limits', () => {
    it('reads the City enforcement format, keeping each time and range on one line', () => {
        // A no-break space inside each time, a word joiner after each dash
        expect(formatEnforceableTime('0910-1750 MON-SAT')).toBe('9:10 AM–⁠5:50 PM, Mon–⁠Sat');
        expect(formatEnforceableTime('0001-2359 MON-FRI')).toBe('All day, Mon–⁠Fri');
        expect(formatEnforceableTime('0710-1750 MON-FRI, 0910-1750 SAT'))
            .toBe('7:10 AM–⁠5:50 PM, Mon–⁠Fri; 9:10 AM–⁠5:50 PM, Sat');
    });

    it('returns text it cannot read unchanged', () => {
        expect(formatEnforceableTime('Event days only')).toBe('Event days only');
        expect(formatEnforceableTime(null)).toBeNull();
    });

    it('labels the maximum stay', () => {
        expect(getMaxStayLabel(street({ max_duration_minutes: 120 }))).toBe('2 hour maximum');
        expect(getMaxStayLabel({ metadata: { max_time: '90.0' } })).toBe('90 minute maximum');
        expect(getMaxStayLabel({})).toBeNull();
    });
});

describe('ranking', () => {
    const { permitLast, rankSpots, sortByWalk } = require('../spotPresentation');
    const spot = (id, distance, price, type = 'on_street') => ({
        id, distance, walkingTime: Math.ceil(distance / 80), price_per_hour: price, spot_type: type,
    });

    it('puts the cheaper spot first when the walk is the same', () => {
        const ranked = sortByWalk([spot('a', 140, 6), spot('b', 150, 3), spot('c', 60, 9)]);
        expect(ranked.map((s) => s.id)).toEqual(['c', 'b', 'a']);
    });

    it('keeps a known rate ahead of an unknown one for the same walk', () => {
        const ranked = sortByWalk([spot('lot', 100, 0, 'off_street'), spot('street', 120, 4)]);
        expect(ranked.map((s) => s.id)).toEqual(['street', 'lot']);
    });

    it('lists permit-only blocks last, unless asked for', () => {
        const spots = [spot('p', 40, 0, 'residential'), spot('a', 140, 6)];
        expect(rankSpots(spots).map((s) => s.id)).toEqual(['a', 'p']);
        expect(permitLast(sortByWalk(spots), 'residential').map((s) => s.id)).toEqual(['p', 'a']);
    });

    it('lists blocks with a maximum under an hour after the rest, before permit-only ones', () => {
        const brief = { ...spot('b', 60, 3), max_duration_minutes: 20 };
        const hour = { ...spot('h', 70, 3), max_duration_minutes: 60 };
        const spots = [brief, hour, spot('a', 140, 6), spot('p', 40, 0, 'residential')];
        expect(rankSpots(spots).map((s) => s.id)).toEqual(['h', 'a', 'b', 'p']);
    });
});
