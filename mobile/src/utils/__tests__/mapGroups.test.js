import { canPart, groupBounds, groupPins, worldPoint, worldSizeFor } from '../mapGroups';

// A spot at [lng, lat], as the API sends it.
const at = (id, lng, lat) => ({ id, spot_type: 'on_street', coordinates: { type: 'Point', coordinates: [lng, lat] } });
// MapLibre's world: 512 pixels across at zoom 0.
const zoom = (z) => 512 * 2 ** z;

// 11 Av SW: the two sides of the street, about 20 m apart, and the next
// block east, about 140 m on.
const north = at('n', -114.0745, 51.0410);
const south = at('s', -114.0745, 51.04082);
const nextBlock = at('e', -114.0725, 51.0410);

describe('groupPins', () => {
    it('gathers pins that would overlap, led by the best', () => {
        const groups = groupPins([north, south, nextBlock], zoom(15));
        expect(groups.map((g) => g.spots.map((s) => s.id))).toEqual([['n', 's'], ['e']]);
        expect(groups[0]).toMatchObject({ key: 'group:n:2', lead: north });
        expect(groups[1].key).toBe('spot:e');
    });

    it('parts them once zoomed in', () => {
        expect(groupPins([north, south, nextBlock], zoom(17))).toHaveLength(3);
    });

    it('draws the selected spot on its own', () => {
        const groups = groupPins([north, south, nextBlock], zoom(15), south);
        expect(groups.map((g) => g.spots.map((s) => s.id))).toEqual([['n'], ['s'], ['e']]);
    });

    it('skips a spot without a place', () => {
        expect(groupPins([{ id: 'x' }, north], zoom(15)).map((g) => g.key)).toEqual(['spot:n']);
    });
});

describe('zooming in on a group', () => {
    it('zooms only when its spots can part', () => {
        expect(canPart({ spots: [north, south] })).toBe(true);
        expect(canPart({ spots: [north, at('n2', -114.07451, 51.04101)] })).toBe(false);
    });

    it('knows the corners around it', () => {
        expect(groupBounds({ spots: [north, south, nextBlock] })).toEqual({
            north: 51.0410, south: 51.04082, east: -114.0725, west: -114.0745,
        });
    });
});

describe('the map\'s scale', () => {
    it('reads it from react-native-maps\' region', () => {
        expect(worldSizeFor(0.01, 390)).toBeCloseTo(14040000);
        const a = worldPoint({ latitude: 51.04, longitude: -114.07 }, worldSizeFor(0.01, 390));
        const b = worldPoint({ latitude: 51.04, longitude: -114.06 }, worldSizeFor(0.01, 390));
        expect(b.x - a.x).toBeCloseTo(390);
    });
});
