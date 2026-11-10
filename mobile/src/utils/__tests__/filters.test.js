import { apiTypeFor, applyType, getTypeLabel, getTypeNote } from '../filters';

const street = { id: 's', spot_type: 'on_street' };
const parkade = { id: 'p', spot_type: 'off_street', metadata: { parking_type: 'PARKADE' } };
const surface = { id: 'l', spot_type: 'off_street', metadata: { parking_type: 'SURFACE LOT' } };

describe('filters', () => {
    it('asks the API for off-street parking for both lots and parkades', () => {
        expect(apiTypeFor('lot')).toBe('off_street');
        expect(apiTypeFor('parkade')).toBe('off_street');
        expect(apiTypeFor('on_street')).toBe('on_street');
        expect(apiTypeFor('all')).toBe('all');
    });

    it('tells parkades from other lots', () => {
        expect(applyType([street, parkade, surface], 'parkade').map((s) => s.id)).toEqual(['p']);
        expect(applyType([parkade, surface], 'lot').map((s) => s.id)).toEqual(['l']);
        expect(applyType([street, parkade], 'all')).toHaveLength(2);
        expect(applyType(null, 'all')).toEqual([]);
    });

    it('names each type', () => {
        expect(getTypeLabel('parkade')).toBe('Parkade');
        expect(getTypeLabel('nope')).toBe('All');
    });

    it('says which type a list is narrowed to, and nothing when it is not', () => {
        expect(getTypeNote('parkade')).toBe('Parkades only');
        expect(getTypeNote('on_street')).toBe('Street parking only');
        expect(getTypeNote('lot')).toBe('Lots only');
        expect(getTypeNote('residential')).toBe('Permit zones only');
        expect(getTypeNote('all')).toBeNull();
    });
});
