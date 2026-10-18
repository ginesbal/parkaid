// Where a live pin's canvas goes on its stage, and where the pin goes in it.
//
// The canvas runs from just above and left of the pin to the stage's
// bottom-right corner, where the runtime draws its badge. Every canvas on a
// stage ends at that corner, so the badges land on the same spot. The canvas
// is never smaller than the badge needs (unless the stage itself is, which
// no phone screen is), so the badge is drawn whole.
//
// pin:   the still's pin on the stage ({ cx, cy, height }, in points)
// stage: the stage size ({ width, height })
// badge: the badge size and inset ({ width, height, inset })
// room:  space above the pin for its motion, as a share of its height
//
// Returns the canvas box on the stage, and the target for the page: the
// pin's centre as fractions of the canvas width and height (u, v), and its
// height as a fraction of the canvas height (h).
export function getCanvasLayout({ pin, stage, badge, room = 0 }) {
    const minWidth = badge.width + 2 * badge.inset;
    const minHeight = badge.height + 2 * badge.inset;
    const left = Math.max(0, Math.min(pin.cx - pin.height, stage.width - minWidth));
    const top = Math.max(0, Math.min(pin.cy - pin.height * (0.5 + room), stage.height - minHeight));
    const width = stage.width - left;
    const height = stage.height - top;

    return {
        box: { position: 'absolute', left, top, width, height },
        target: {
            u: (pin.cx - left) / width,
            v: (pin.cy - top) / height,
            h: pin.height / height,
        },
    };
}
