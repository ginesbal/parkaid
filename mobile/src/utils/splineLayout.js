// Where to put a live Spline scene so its pin lands on the still: the same
// height and the same centre, so the crossfade between them does not jump.
// A Spline camera draws the pin at a fixed share of the canvas height, so
// the canvas height sets the pin's size; the width is free.
//
// size:  the still's box (square, in points)
// width: the canvas width; the scene needs room around the pin to move
// frame: where the scene draws its pin, as fractions of the canvas height
//        ({ height, centerY })
// still: where the still draws its pin, as fractions of its box
//        ({ height, centerX, centerY })
//
// Returns the canvas box, relative to the still's top-left corner. The scene
// centres its pin horizontally.
export function getLiveBox({ size, width, frame, still }) {
    const height = (size * still.height) / frame.height;
    return {
        position: 'absolute',
        left: size * still.centerX - width / 2,
        top: size * still.centerY - frame.centerY * height,
        width,
        height,
    };
}
