import { getLiveBox } from '../splineLayout';

const FRAME = { height: 0.5, centerY: 0.6 };
const STILL = { height: 0.75, centerX: 0.5, centerY: 0.5 };

describe('getLiveBox', () => {
    it('sizes the canvas so the scene pin matches the still', () => {
        const box = getLiveBox({ size: 100, width: 300, frame: FRAME, still: STILL });
        // A 75 pt pin at half the canvas height needs a 150 pt canvas.
        expect(box.height).toBeCloseTo(150);
        expect(box.width).toBe(300);
        expect(box.position).toBe('absolute');
    });

    it('centres the scene pin on the still pin', () => {
        const size = 96;
        const box = getLiveBox({ size, width: 288, frame: FRAME, still: { ...STILL, centerX: 0.54 } });
        const pinX = box.left + box.width / 2;
        const pinY = box.top + FRAME.centerY * box.height;
        expect(pinX).toBeCloseTo(size * 0.54);
        expect(pinY).toBeCloseTo(size * STILL.centerY);
    });
});
