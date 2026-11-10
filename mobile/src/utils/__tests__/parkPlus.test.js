import {
    getAddedNote,
    getEndNote,
    getExpiredLine,
    getExtendNote,
    getPayLine,
    getSessionPayLine,
    getSessionZone,
    getZoneNumber,
} from '../parkPlus';

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

    it('says Add only changes the timer, and what the time costs where', () => {
        expect(getExtendNote({ cost: 2.5, zone: 'Zone 1684' })).toBe('Timer only. $2.50 more in ParkPlus.');
        expect(getExtendNote({ cost: 2.5, zone: null })).toBe('Timer only. $2.50 more where you paid.');
        expect(getExtendNote({ cost: 0, zone: 'Zone 1684' })).toBe('Timer only. Free at that time.');
        expect(getExtendNote({ cost: null, zone: 'Zone 1684' })).toBe('Timer only. What you paid for doesn’t change.');
    });

    // A MyParking session runs until it is ended there; a pay station sells
    // a set time.
    it('asks for more time only where a set time was bought', () => {
        expect(getAddedNote(15)).toBe('Paid for a set time? Buy 15 min more where you paid.');
    });

    it('says to end the MyParking session too, for a street zone', () => {
        expect(getEndNote({ spotId: 'Zone 1684' })).toMatch(/^Paid in MyParking\? End your session there too/);
        expect(getEndNote({ spotId: 'Parkade' })).toBeNull();
        expect(getExpiredLine({ spotId: 'Zone 1684' })).toBe('Move your car. Paid in MyParking? End your session there too.');
        expect(getExpiredLine({ spotId: 'Parkade' })).toBe('Move your car, or pay for more time where you paid.');
    });

    it('says the same for a stored session', () => {
        expect(getSessionPayLine({ spotId: 'Zone 1684' })).toMatch(/with zone 1684\.$/);
        expect(getSessionPayLine({ spotId: 'Surface lot' })).toMatch(/Pay at the lot\.$/);
        expect(getSessionPayLine({ spotId: null })).toMatch(/at the meter or in ParkPlus\.$/);
    });
});
