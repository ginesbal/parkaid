import { calgaryNow, getPriceInfo, parseRates } from '../spotInfo';

// Real rate text from the City's "On-Street Parking Zones with Rates" data.
const DOWNTOWN = '<b>Mon-Fri 9:00 AM to 11:00 AM</b><br><br>$4.00 per Hour<br><br><b>Mon-Fri 11:00 AM to 1:30 PM</b><br><br>$4.25 per Hour<br><br><b>Mon-Fri 1:30 PM to 3:30 PM</b><br><br>$3.25 per Hour<br><br><b>Mon-Fri 3:30 PM to 6:00 PM</b><br><br>$2.25 per Hour<br><br><b>Saturday: 9:00 AM to 6:00 PM</b><br><br>$1.00 per Hour<br><br><b>Sunday/Holidays:</b><br><br>Free parking<br><br><b>Free parking to 9 AM</b><br><br>See Signs /Parking Restrictions<br><br>';
const RUSH_HOUR = '<b>Mon-Fri 8:30 AM to 11:00 AM</b><br><br>$3.75 per Hour<br><br><b>Mon-Fri 11:00 AM to 1:30 PM</b><br><br>$4.50 per Hour<br><br><b>Mon-Fri 1:30 PM to 3:30 PM</b><br><br>$3.75 per Hour<br><br><b>No Parking at this time</b><br><br>See Street Signs<br><br><b>Saturday: 9:00 AM to 6:00 PM</b><br><br>$1.00 per Hour<br><br><b>Sunday/Holidays:</b><br><br>Free parking<br><br>';
const LOADING = '<b>Loading zone:</b><br><br>Free 20 mins<br><br>';
const TWENTY_FOUR_HOUR = '<b>Weekdays: 09:00 to 18:00</b><br><br>$2.00 per Hour<br><br>';

const spot = (html, extra = {}) => ({ zone_info: { html_zone_rate: html, price_zone: '5', ...extra } });
// Calgary is UTC-6 in October (daylight time). Oct 14, 2026 is a Wednesday.
const at = (iso) => new Date(iso);
const WED_NOON = at('2026-10-14T18:00:00Z');

describe('calgaryNow', () => {
    it("reads Calgary's clock, wherever the device is", () => {
        expect(calgaryNow(WED_NOON)).toEqual({ day: 3, hour: 12 });
        expect(calgaryNow(at('2026-10-15T03:30:00Z'))).toEqual({ day: 3, hour: 21.5 });
    });
});

describe('parseRates', () => {
    it('reads each window, the weekend, and skips the notes', () => {
        const { windows, special } = parseRates(DOWNTOWN);
        expect(special).toBeNull();
        expect(windows).toHaveLength(6);
        expect(windows[1]).toMatchObject({ start: 11, end: 13.5, kind: 'paid', amount: 4.25, perHour: true });
        expect([...windows[4].days]).toEqual([6]);
        expect(windows[5]).toMatchObject({ start: 0, end: 24, kind: 'free' });
    });

    it('reads 24-hour times', () => {
        expect(parseRates(TWENTY_FOUR_HOUR).windows[0]).toMatchObject({ start: 9, end: 18, amount: 2 });
    });

    it('names blocks that are not general parking', () => {
        expect(parseRates(LOADING).special).toEqual({ label: 'Loading zone', note: 'Free for 20 minutes' });
    });

    it('returns nothing for text it cannot read', () => {
        expect(parseRates('')).toEqual({ windows: [], special: null });
        expect(parseRates(undefined)).toEqual({ windows: [], special: null });
    });
});

describe('getPriceInfo', () => {
    it('shows the rate in effect now, and when it changes', () => {
        const p = getPriceInfo(spot(DOWNTOWN), WED_NOON);
        expect(p).toMatchObject({ kind: 'paid', value: '$4.25', unit: 'per hour', amount: 4.25 });
        expect(p.status).toEqual({ state: 'paid', label: 'Paid right now', detail: '$3.25 from 1:30 PM' });
        expect(getPriceInfo(spot(DOWNTOWN), at('2026-10-14T16:00:00Z')).value).toBe('$4.00');
    });

    it('says when paid parking ends', () => {
        expect(getPriceInfo(spot(DOWNTOWN), at('2026-10-14T23:00:00Z')).note).toBe('until 6 PM');
    });

    it('is free outside paid hours, and says when paying starts again', () => {
        const evening = getPriceInfo(spot(DOWNTOWN), at('2026-10-15T02:00:00Z'));
        expect(evening).toMatchObject({ kind: 'free', value: 'Free now', note: 'paid from 9 AM tomorrow' });
        expect(getPriceInfo(spot(DOWNTOWN), at('2026-10-14T13:00:00Z')).note).toBe('paid from 9 AM');
    });

    it('knows the weekend', () => {
        expect(getPriceInfo(spot(DOWNTOWN), at('2026-10-17T16:00:00Z')).value).toBe('$1.00');
        const sunday = getPriceInfo(spot(DOWNTOWN), at('2026-10-18T18:00:00Z'));
        expect(sunday).toMatchObject({ kind: 'free', note: 'paid from 9 AM tomorrow' });
        expect(getPriceInfo(spot(DOWNTOWN), at('2026-10-18T02:00:00Z')).note).toBe('paid from Mon 9 AM');
    });

    it('says no parking during rush-hour tow-away times', () => {
        const rush = spot(RUSH_HOUR, { parking_restrict_type: 'AM&PM', parking_restrict_time: '07:00 - 08:30 , 15:30 - 18:00' });
        expect(getPriceInfo(rush, at('2026-10-14T22:00:00Z'))).toMatchObject({ kind: 'no_parking', value: 'No parking', note: 'until 6 PM' });
        expect(getPriceInfo(rush, WED_NOON)).toMatchObject({ kind: 'paid', value: '$4.50' });
        // Weekends have no rush hour.
        expect(getPriceInfo(rush, at('2026-10-17T22:00:00Z'))).toMatchObject({ kind: 'paid', value: '$1.00' });
    });

    it('labels a loading zone instead of calling it free parking', () => {
        expect(getPriceInfo(spot(LOADING), WED_NOON)).toMatchObject({ kind: 'zone', value: 'Loading zone', note: 'Free for 20 minutes' });
    });

    it('never turns a zone number into a price', () => {
        // Zone "5" is a name; its real rate is $4.00–$4.25, not $5.00.
        expect(getPriceInfo({ zone_info: { price_zone: '5' }, price: 5, price_per_hour: 5 }, WED_NOON))
            .toMatchObject({ kind: 'unknown', value: 'Rate on signs' });
    });
});
