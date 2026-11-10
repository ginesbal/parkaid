import { getCanvasLayout } from '../splineLayout';

const BADGE = { width: 274, height: 72, inset: 12 };
const STAGE = { width: 390, height: 760 };

// The pin, in stage points, from the target the page is given.
const pinFrom = ({ box, target }) => ({
    cx: box.left + target.u * box.width,
    cy: box.top + target.v * box.height,
    height: target.h * box.height,
});

describe('getCanvasLayout', () => {
    it('ends every canvas at the stage corner, where the badge goes', () => {
        for (const pin of [{ cx: 340, cy: 60, height: 40 }, { cx: 195, cy: 380, height: 73 }]) {
            const { box } = getCanvasLayout({ pin, stage: STAGE, badge: BADGE });
            expect(box.left + box.width).toBe(STAGE.width);
            expect(box.top + box.height).toBe(STAGE.height);
        }
    });

    it('puts the scene pin exactly on the still', () => {
        const pin = { cx: 340, cy: 60, height: 40 };
        const layout = getCanvasLayout({ pin, stage: STAGE, badge: BADGE, room: 0.45 });
        const placed = pinFrom(layout);
        expect(placed.cx).toBeCloseTo(pin.cx);
        expect(placed.cy).toBeCloseTo(pin.cy);
        expect(placed.height).toBeCloseTo(pin.height);
    });

    it('is always wide and tall enough for the whole badge', () => {
        // A pin in the bottom-right corner itself.
        const { box } = getCanvasLayout({ pin: { cx: 370, cy: 740, height: 30 }, stage: STAGE, badge: BADGE });
        expect(box.width).toBeGreaterThanOrEqual(BADGE.width + 2 * BADGE.inset);
        expect(box.height).toBeGreaterThanOrEqual(BADGE.height + 2 * BADGE.inset);
    });

    it('leaves room above the pin for its motion, within the stage', () => {
        const pin = { cx: 195, cy: 380, height: 100 };
        const { box } = getCanvasLayout({ pin, stage: STAGE, badge: BADGE, room: 0.45 });
        expect(box.top).toBeCloseTo(pin.cy - pin.height * 0.95);
        const high = getCanvasLayout({ pin: { ...pin, cy: 40 }, stage: STAGE, badge: BADGE, room: 0.45 });
        expect(high.box.top).toBe(0);
    });

    it('spans the stage when it is narrower than the badge', () => {
        const { box } = getCanvasLayout({ pin: { cx: 120, cy: 200, height: 60 }, stage: { width: 240, height: 400 }, badge: BADGE });
        expect(box.left).toBe(0);
        expect(box.width).toBe(240);
    });
});
