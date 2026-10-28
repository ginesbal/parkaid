// The /nearby spot shape, from a database row. No database needed.
const { NOT_PUBLIC_ZONES, mergeSegments, toSpot } = require('../utils/spotRows');

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

describe('mergeSegments', () => {
  test('sends a zone\'s stretch of a block once, at its nearest segment', () => {
    const rows = [row({ id: 1, distance: 40 }), row({ id: 2, distance: 60 }), row({ id: 3, distance: 90 })];
    expect(mergeSegments(rows).map((r) => r.id)).toEqual([1]);
  });

  test('keeps the other side, another zone, and different rules apart', () => {
    const rows = [
      row({ id: 1 }),
      row({ id: 2, block_side: 'S', parking_zone: '1920' }),
      row({ id: 3, parking_zone: '1685' }),
      row({ id: 4, max_time: '20.0' }),
      row({ id: 5 }),
    ];
    expect(mergeSegments(rows).map((r) => r.id)).toEqual([1, 2, 3, 4]);
  });

  test('sends a permit block once, unless its rules differ', () => {
    const permit = (over) => ({
      spot_type: 'residential', address_desc: '600 Block ROYAL AV SW', permit_zone: 'J',
      enforceable_time: '0001-2359 MON-SUN', parking_restriction: 'Permit Required', time_restriction: 'NONE', ...over,
    });
    const rows = [permit({ id: 1 }), permit({ id: 2 }), permit({ id: 3, time_restriction: '2 HR' })];
    expect(mergeSegments(rows).map((r) => r.id)).toEqual([1, 3]);
  });

  test('never merges lots', () => {
    const lot = { id: 7, spot_type: 'off_street', parking_zone: null };
    expect(mergeSegments([lot, { ...lot, id: 9 }]).map((r) => r.id)).toEqual([7, 9]);
  });
});

describe('NOT_PUBLIC_ZONES', () => {
    test('names the City zone types the public cannot park in', () => {
        expect(NOT_PUBLIC_ZONES).toEqual(expect.arrayContaining(['Taxi Zone', 'Access Calgary Loading Zone']));
        expect(NOT_PUBLIC_ZONES).not.toContain('Loading Zone');
        expect(NOT_PUBLIC_ZONES).not.toContain('Parking Zone');
    });
});
