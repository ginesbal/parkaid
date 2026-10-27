import { getExtendNote, getPayLine, getSessionPayLine, getSessionZone, getZoneNumber } from '../parkPlus';

describe('parkPlus', () => {
    it('reads the zone from a session, and only a zone', () => {
        expect(getSessionZone({ spotId: 'Zone 1684' })).toBe('Zone 1684');
        expect(getSessionZone({ spotId: 'Parkade' })).toBeNull();
        expect(getSessionZone({ spotId: null })).toBeNull();
        expect(getSessionZone(null)).toBeNull();
    });

    it('gives the number to type into ParkPlus', () => {
        expect(getZoneNumber('Zone 1684')).toBe('1684');
        expect(getZoneNumber(null)).toBe('');
    });

    it('says where to pay, never that the timer paid', () => {
        expect(getPayLine({ zone: 'Zone 1684' })).toBe('ParkAid only keeps time. Pay in ParkPlus with zone 1684.');
        expect(getPayLine({ lot: true })).toBe('ParkAid only keeps time. Pay at the lot.');
        expect(getPayLine()).toBe('ParkAid only keeps time. Pay at the meter or in ParkPlus.');
    });

    it('says Add only changes the timer, and what to pay where', () => {
        expect(getExtendNote({ cost: 2.5, zone: 'Zone 1684' })).toBe('Timer only. Pay $2.50 more in ParkPlus.');
        expect(getExtendNote({ cost: 2.5, zone: null })).toBe('Timer only. Pay $2.50 more where you paid.');
        expect(getExtendNote({ cost: 0, zone: 'Zone 1684' })).toBe('Timer only. Free at that time.');
        expect(getExtendNote({ cost: null, zone: 'Zone 1684' })).toBe('Timer only. Add the same time in ParkPlus.');
        expect(getExtendNote({ cost: null, zone: null })).toBe('Timer only. Add the same time where you paid.');
    });

    it('says the same for a stored session', () => {
        expect(getSessionPayLine({ spotId: 'Zone 1684' })).toMatch(/with zone 1684\.$/);
        expect(getSessionPayLine({ spotId: 'Surface lot' })).toMatch(/Pay at the lot\.$/);
        expect(getSessionPayLine({ spotId: null })).toMatch(/at the meter or in ParkPlus\.$/);
    });
});
