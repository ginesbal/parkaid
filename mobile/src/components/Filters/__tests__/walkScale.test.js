import { WALK_MINUTES, walkPhrase } from '../../../constants/parking';
import { THUMB, minutesAt, thumbLeft } from '../walkScale';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const WIDTH = 324; // a 300px run for the thumb's centre, plus half a thumb each end

describe('walk slider scale', () => {
    it('reads the ends of the track as the shortest and longest walks', () => {
        expect(minutesAt(THUMB / 2, WIDTH)).toBe(WALK_MINUTES.min);
        expect(minutesAt(WIDTH - THUMB / 2, WIDTH)).toBe(WALK_MINUTES.max);
        // Past the ends still clamps.
        expect(minutesAt(-40, WIDTH)).toBe(WALK_MINUTES.min);
        expect(minutesAt(WIDTH + 40, WIDTH)).toBe(WALK_MINUTES.max);
    });

    it('lands on whole minutes in between', () => {
        // 1..25 is 24 steps over 300px: 12.5px a minute.
        expect(minutesAt(THUMB / 2 + 62.5, WIDTH)).toBe(6);
        expect(minutesAt(THUMB / 2 + 150, WIDTH)).toBe(13);
    });

    it('puts the thumb back where a minute reads', () => {
        for (const minutes of [1, 6, 13, 25]) {
            expect(minutesAt(thumbLeft(minutes, WIDTH) + THUMB / 2, WIDTH)).toBe(minutes);
        }
    });

    it('is safe before the track has a width', () => {
        expect(minutesAt(100, 0)).toBe(WALK_MINUTES.min);
        expect(thumbLeft(10, 0)).toBe(0);
    });
});

describe('walkPhrase', () => {
    it('reads naturally', () => {
        expect(walkPhrase(6)).toBe('a 6-minute walk');
        expect(walkPhrase(8)).toBe('an 8-minute walk');
        expect(walkPhrase(11)).toBe('an 11-minute walk');
        expect(walkPhrase(25)).toBe('a 25-minute walk');
    });
});
