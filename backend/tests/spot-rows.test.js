// The /nearby spot shape, from a database row. No database needed.
const { NOT_PUBLIC_ZONES, toSpot } = require('../utils/spotRows');

// A street block as stored from the City's on-street data.
const row = (over = {}) => ({
    id: 8,
    spot_type: 'on_street',
    address_desc: '6 Av SW ,  Fr 8 St SW To 9 St SW',
    coordinates: { type: 'Point', coordinates: [-114.0805, 51.048] },
    distance: 141.6,
    parking_zone: '1684',
    permit_zone: '1684',
    price_zone: '6',
    enforceable_time: '0910-1520 MON-FRI',
    parking_restrict_type: 'AM&PM',
    parking_restrict_time: '07:00 - 08:30 , 15:30 - 18:00',
    max_time: '120.0',
    block_side: 'N',
    zone_cap: 10,
    ...over,
});

describe('toSpot', () => {
    test('rounds the distance and works out the walk', () => {
        const spot = toSpot(row());
        expect(spot.distance).toBe(142);
        expect(spot.walkingTime).toBe(2);
        expect(spot.max_duration_minutes).toBe(120);
    });

    test('passes the rush-hour restriction through', () => {
        expect(toSpot(row()).zone_info).toMatchObject({
            enforceable_time: '0910-1520 MON-FRI',
            parking_restrict_type: 'AM&PM',
            parking_restrict_time: '07:00 - 08:30 , 15:30 - 18:00',
        });
    });

    test('reads the City\'s "none" as no restriction', () => {
        const spot = toSpot(row({ parking_restrict_type: 'none', parking_restrict_time: 'none' }));
        expect(spot.zone_info.parking_restrict_type).toBeNull();
        expect(spot.zone_info.parking_restrict_time).toBeNull();
        expect(toSpot(row({ parking_restrict_time: undefined })).zone_info.parking_restrict_time).toBeNull();
    });
});

describe('NOT_PUBLIC_ZONES', () => {
    test('names the City zone types the public cannot park in', () => {
        expect(NOT_PUBLIC_ZONES).toEqual(expect.arrayContaining(['Taxi Zone', 'Access Calgary Loading Zone']));
        expect(NOT_PUBLIC_ZONES).not.toContain('Loading Zone');
        expect(NOT_PUBLIC_ZONES).not.toContain('Parking Zone');
    });
});
