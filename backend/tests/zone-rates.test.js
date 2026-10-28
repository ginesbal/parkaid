// The City's rate text, as it appears in its map layer. No database needed.
const { parseZoneRate, rateAt } = require('../utils/zoneRates');
const { toSpot } = require('../utils/spotRows');

const WEEKDAYS = [1, 2, 3, 4, 5];

// Zone 1684, 6 Av SW from 8 St to 9 St.
const ZONE_1684 = '<b>Mon-Fri 9:00 AM to 11:00 AM</b><br><br>$2.00 per Hour<br><br>'
    + '<b>Mon-Fri 11:00 AM to 1:30 PM</b><br><br>$2.25 per Hour<br><br>'
    + '<b>Mon-Fri 1:30 PM to 3:30 PM</b><br><br>$2.00 per Hour<br><br>'
    + '<b>Saturday: 9:00 AM to 6:00 PM</b><br><br>Free Parking<br><br>'
    + '<b>Sunday/Holidays:</b><br><br>Free parking<br><br>'
    + '<b>Free parking to 7 AM</b><br><br>See Signs /Parking Restrictions<br><br>';

describe('parseZoneRate', () => {
    test('reads rates by time of day, and free days', () => {
        expect(parseZoneRate(ZONE_1684).periods).toEqual([
            { days: WEEKDAYS, from: 540, to: 660, rate: 2, dayMax: null },
            { days: WEEKDAYS, from: 660, to: 810, rate: 2.25, dayMax: null },
            { days: WEEKDAYS, from: 810, to: 930, rate: 2, dayMax: null },
            { days: [6], from: 540, to: 1080, rate: 0, dayMax: null },
            { days: [0], from: 0, to: 1440, rate: 0, dayMax: null },
        ]);
    });

    test('reads half-hour prices, daily maximums and 24-hour times', () => {
        const zone = '<b>Weekdays: 09:00 to 18:00</b><br><br>$0.50 per 1/2 hour, max:$6.00<br><br>'
            + '<b>Saturday: 09:00 to 18:00</b><br><br>$0.50 per 1/2 hour, max:$2.00<br><br>';
        expect(parseZoneRate(zone).periods).toEqual([
            { days: WEEKDAYS, from: 540, to: 1080, rate: 1, dayMax: 6 },
            { days: [6], from: 540, to: 1080, rate: 1, dayMax: 2 },
        ]);
        expect(parseZoneRate('<b>Mon-Fri 7:00 AM to 6:00 PM</b><br><br>$2.00 each 30 Min Max@:@ 30 Min<br><br>').periods[0])
            .toMatchObject({ from: 420, to: 1080, rate: 4, dayMax: null });
        expect(parseZoneRate('<b>Weekdays: Max 9 Hours</b><br><br>$1.50 per hour, max:$6.00<br><br>').periods[0])
            .toEqual({ days: WEEKDAYS, from: 0, to: 1440, rate: 1.5, dayMax: 6 });
    });

    test('copes with the City\'s typos', () => {
        const zone = '<b>Mon-Fri 9:00 AM to 11:00 AM</b><br><br>$1.005 per Hour<br><br>'
            + '<b>Mon-Fri 11:00 AM to 1:30 PM</b><br><br>1.00 per Hour<br><br>'
            + '<b>Mon-Fri 8:30 AM to 09:00 AM</b><br><br>Free Parking<br><br>'
            + '<b>Saturday: 9:00 AM to 6:00 PM</b><br><br>$1.00<br><br>';
        expect(parseZoneRate(zone).periods.map((p) => [p.from, p.rate])).toEqual([[540, 1], [660, 1], [510, 0], [540, 1]]);
    });

    test('reads a loading zone as free whenever it is one', () => {
        expect(parseZoneRate('<b>Loading zone:</b><br><br>Free 20 mins<br><br>').periods)
            .toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], from: 0, to: 1440, rate: 0, dayMax: null }]);
    });

    test('makes nothing up from text it cannot read', () => {
        expect(parseZoneRate('<b>Taxi zone:</b><br><br>Press GREEN Button to Register<br><br>')).toBeNull();
        expect(parseZoneRate('<b>No Parking at this time</b><br><br>See Street Signs<br><br>')).toBeNull();
        expect(parseZoneRate('')).toBeNull();
        expect(parseZoneRate(null)).toBeNull();
    });
});

describe('rateAt', () => {
    const rates = parseZoneRate(ZONE_1684);

    test('gives the rate in Calgary at that moment', () => {
        // Tuesday 20 October 2026, 1:40 PM in Calgary (MDT, UTC-6)
        expect(rateAt(rates, new Date('2026-10-20T19:40:00Z'))).toBe(2);
        expect(rateAt(rates, new Date('2026-10-20T18:00:00Z'))).toBe(2.25);
        expect(rateAt(rates, new Date('2026-10-24T18:00:00Z'))).toBe(0); // Saturday noon: free
        expect(rateAt(rates, new Date('2026-10-21T01:00:00Z'))).toBeNull(); // 7 PM: no period
        expect(rateAt(null)).toBeNull();
    });
});

describe('toSpot rates', () => {
    test('sends the periods, and no price for a zone without them', () => {
        const row = { id: 1, spot_type: 'on_street', distance: 100, price_zone: '6', html_zone_rate: ZONE_1684 };
        const spot = toSpot(row, new Date('2026-10-20T19:40:00Z'));
        expect(spot.rates.periods).toHaveLength(5);
        expect(spot.price_per_hour).toBe(2);
        const unpriced = toSpot({ ...row, html_zone_rate: null });
        expect(unpriced.rates).toBeNull();
        expect(unpriced.price_per_hour).toBeNull();
    });
});
