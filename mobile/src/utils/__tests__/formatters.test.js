import { formatCost, noLoneWord } from '../formatters';

describe('noLoneWord', () => {
    it('joins a hint\'s last two words, so its last line never holds one', () => {
        expect(noLoneWord('2 hour maximum here. Check posted signs.')).toBe('2 hour maximum here. Check posted signs.');
        expect(noLoneWord('Drag the map, then tap Search this area. ')).toBe('Drag the map, then tap Search this area.');
    });

    it('leaves one word, and nothing, as they are', () => {
        expect(noLoneWord('Free')).toBe('Free');
        expect(noLoneWord(null)).toBeNull();
    });
});

describe('formatCost', () => {
    it('says Free for nothing to pay', () => {
        expect(formatCost(0)).toBe('Free');
    });
});
