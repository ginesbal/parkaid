import {
    formatEnforceableTime,
    getBlockSide,
    getCrossStreets,
    getDayRates,
    getMaxStayLabel,
    getRateDisplay,
    getRowMeta,
    getShortLimit,
    getSpotKind,
    getSpotName,
    getZoneLabel,
    isCovered,
    isParkedAt,
    nameApart,
    pickTopSpot,
    sortByValue,
    tidyName,
} from '../spotPresentation';

// A rate all day, every day (see utils/rates).
const rates = (rate) => ({ periods: [{ days: [0, 1, 2, 3, 4, 5, 6], from: 0, to: 1440, rate, dayMax: null }] });
// Local times; 2026-10-20 is a Tuesday.
const NOW = new Date('2026-10-20T13:40:00');
const words = (text) => text.replace(/[  ]/g, ' ').replace(/⁠/g, '');

// Shapes follow backend/utils/spotRows.js and City of Calgary open data.
const street = (over = {}) => ({
    id: 's',
    spot_type: 'on_street',
    address: 'Eau Claire Av SW ,  Fr 4 St SW To 5 St SW',
    distance: 200,
    zone_info: { parking_zone: '1008', enforceable_time: '0910-1750 MON-SAT' },
    rates: rates(5),
    max_duration_minutes: 180,
    ...over,
});

describe('where you are parked', () => {
    // As stored by useSessionManager: the spot's id, and its zone.
    const session = { parkingSpotId: 7, spotId: 'Zone 1008', locationName: 'Eau Claire Ave SW' };

    it('knows the spot, and another stretch of its zone', () => {
        expect(isParkedAt(session, street({ id: 7 }))).toBe(true);
        expect(isParkedAt(session, street({ id: 8 }))).toBe(true);
        expect(isParkedAt(session, street({ id: 9, zone_info: { parking_zone: '1062' } }))).toBe(false);
        expect(isParkedAt({ parkingSpotId: 7, spotId: 'Parkade' }, { id: 7, spot_type: 'off_street' })).toBe(true);
        expect(isParkedAt(null, street())).toBe(false);
    });

    it('tells two blocks of one street apart in a sentence', () => {
        expect(nameApart('Eau Claire Ave SW', '4 St SW to 5 St SW, north side', '9 Ave SW')).toBe('Eau Claire Ave SW');
        expect(nameApart('Eau Claire Ave SW', '4 St SW to 5 St SW, north side', 'Eau Claire Ave SW'))
            .toBe('Eau Claire Ave SW, 4 St SW to 5 St SW, north side');
        expect(nameApart(null, null, '9 Ave SW')).toBeNull();
    });
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
        expect(words(getCrossStreets(street()))).toBe('4–5 St');
        expect(words(getCrossStreets(street({ address: '6 St SW ,  Fr 10 Av SW To 11 Av SW' })))).toBe('10–11 Ave');
        expect(getCrossStreets(street({ address: '3 Av SW ,  Fr Centre St S To 1 St SW' }))).toBe('Centre St S to 1 St');
        expect(getCrossStreets(street({ address: '2 Av SW ,  Fr 4 St SW To Bow River' }))).toBe('4 St to Bow River');
        expect(getCrossStreets(lot)).toBeNull();
    });

    it('calls out a maximum stay under 2 hours, kept on one line', () => {
        expect(getShortLimit(street({ max_duration_minutes: 20 }))).toBe('20 min max');
        expect(getShortLimit(street({ max_duration_minutes: 60 }))).toBe('1 hour max');
        expect(getShortLimit(street({ max_duration_minutes: 120 }))).toBeNull();
        expect(getShortLimit(lot)).toBeNull();
    });

    it('describes a row by its block and walk, or its kind and walk', () => {
        expect(words(getRowMeta(street({ walkingTime: 3 })))).toBe('4–5 St · 3 min walk');
        expect(words(getRowMeta(lot))).toBe('Parkade · 4 min walk');
        expect(words(getRowMeta(permit))).toBe('Permit zone · 2 min walk');
    });

    // Eau Claire Av SW from 4 to 5 St is zone 1008 on the north side and
    // zone 1062 on the south.
    it('tells the two sides of a block apart', () => {
        const north = street({ walkingTime: 3, metadata: { block_side: 'N' } });
        expect(getBlockSide(north)).toBe('north side');
        expect(getBlockSide(street({ metadata: { block_side: 'w' } }))).toBe('west side');
        expect(words(getRowMeta(north))).toBe('4–5 St, north side · 3 min walk');
        expect(getSpotName(north)).toEqual({ title: 'Eau Claire Ave SW', detail: '4 St SW to 5 St SW, north side' });
    });

    it('names no side it does not know', () => {
        expect(getBlockSide(street())).toBeNull();
        expect(getBlockSide(street({ metadata: { block_side: 'X' } }))).toBeNull();
        expect(getBlockSide({ ...lot, metadata: { block_side: 'N' } })).toBeNull();
    });
});

describe('rates', () => {
    it('shows the rate now, from the City\'s rates by time of day', () => {
        expect(getRateDisplay(street(), NOW)).toEqual({ amount: '$5.00', unit: '/ hour', spoken: '$5.00 per hour' });
    });

    it('says free while the City isn\'t charging, known rate or not', () => {
        const evening = new Date('2026-10-20T19:00:00');
        expect(getRateDisplay(street(), evening)).toEqual({ amount: 'Free', unit: 'now', spoken: 'Free now' });
        expect(getRateDisplay(street({ rates: null }), evening).amount).toBe('Free');
    });

    it('never calls an unknown rate free, or makes one up', () => {
        expect(getRateDisplay(street({ rates: null }), NOW).note).toBe('Check posted signs');
        // A price from the old API is a guess from the zone code; it is ignored.
        expect(getRateDisplay(street({ rates: null, price_per_hour: 6 }), NOW).note).toBe('Check posted signs');
        expect(getRateDisplay({ spot_type: 'off_street' })).toMatchObject({ note: 'Rates posted at lot', short: 'Rates at lot' });
        expect(getRateDisplay({ spot_type: 'residential' }).note).toBe('Permit holders only');
    });

    // Zone 1008, Eau Claire Av SW from 4 to 5 St, as the City has it.
    const WEEKDAYS = [1, 2, 3, 4, 5];
    const eauClaire = street({
        rates: {
            periods: [
                { days: WEEKDAYS, from: 540, to: 660, rate: 3.75, dayMax: null },
                { days: WEEKDAYS, from: 660, to: 810, rate: 4.25, dayMax: null },
                { days: WEEKDAYS, from: 810, to: 930, rate: 3.25, dayMax: null },
                { days: WEEKDAYS, from: 930, to: 1080, rate: 2.25, dayMax: null },
                { days: [6], from: 540, to: 1080, rate: 1, dayMax: null },
                { days: [0], from: 0, to: 1440, rate: 0, dayMax: null },
            ],
        },
    });
    const table = (day) => day && { ...day, rows: day.rows.map((r) => [words(r.time), r.rate]) };

    it('lists the day\'s rates, only while the City charges', () => {
        expect(table(getDayRates(eauClaire, NOW))).toEqual({
            day: 'today',
            rows: [['9:10–11 AM', '$3.75'], ['11 AM–1:30 PM', '$4.25'], ['1:30–3:30 PM', '$3.25'], ['3:30–5:50 PM', '$2.25']],
            dayMax: null,
        });
    });

    it('moves on to the next day that charges once today\'s charging is over', () => {
        expect(getDayRates(eauClaire, new Date('2026-10-20T19:00:00')).day).toBe('tomorrow');
        expect(table(getDayRates(eauClaire, new Date('2026-10-23T19:00:00')))).toMatchObject({
            day: 'tomorrow',
            rows: [['9:10 AM–5:50 PM', '$1.00']],
        });
        // Sunday is free, so after Saturday's charging comes Monday's.
        expect(getDayRates(eauClaire, new Date('2026-10-24T19:00:00')).day).toBe('Monday');
    });

    it('joins one rate across periods, and gives a day\'s cap', () => {
        const capped = street({
            rates: {
                periods: [
                    { days: WEEKDAYS, from: 540, to: 720, rate: 1.5, dayMax: 6 },
                    { days: WEEKDAYS, from: 720, to: 1080, rate: 1.5, dayMax: 6 },
                ],
            },
        });
        expect(table(getDayRates(capped, NOW))).toEqual({ day: 'today', rows: [['9:10 AM–5:50 PM', '$1.50']], dayMax: '$6.00' });
    });

    it('lists nothing without rates, or when they are all free', () => {
        expect(getDayRates(street({ rates: null }), NOW)).toBeNull();
        expect(getDayRates(street({ rates: rates(0) }), NOW)).toBeNull();
        expect(getDayRates({ spot_type: 'off_street' }, NOW)).toBeNull();
    });

    it('sorts by the rate now, unknown last, ties by distance', () => {
        const sorted = sortByValue([
            street({ id: 'unknown', rates: null, distance: 10 }),
            street({ id: 'six', rates: rates(6), distance: 50 }),
            street({ id: 'two-far', rates: rates(2), distance: 400 }),
            street({ id: 'two-near', rates: rates(2), distance: 100 }),
        ], NOW);
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
        id, distance, walkingTime: Math.ceil(distance / 80), rates: price ? rates(price) : null, spot_type: type,
    });

    it('puts the cheaper spot first when the walk is the same', () => {
        const ranked = sortByWalk([spot('a', 140, 6), spot('b', 150, 3), spot('c', 60, 9)], NOW);
        expect(ranked.map((s) => s.id)).toEqual(['c', 'b', 'a']);
    });

    it('keeps a known rate ahead of an unknown one for the same walk', () => {
        const ranked = sortByWalk([spot('lot', 100, 0, 'off_street'), spot('street', 120, 4)], NOW);
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
