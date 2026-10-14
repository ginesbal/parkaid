import { WALK_MINUTES } from '../../constants/parking';

// The walk slider's scale: where a minute sits along the track, and which
// minute is under a point. The thumb's centre runs from half a thumb in at
// one end to half a thumb in at the other.

export const THUMB = 24;
const { min: MIN, max: MAX } = WALK_MINUTES;

// The minute under x pixels along a track `width` wide.
export const minutesAt = (x, width) => {
    if (!(width > THUMB)) return MIN;
    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / (width - THUMB)));
    return Math.round(MIN + ratio * (MAX - MIN));
};

// The thumb's left edge for `minutes` on a track `width` wide.
export const thumbLeft = (minutes, width) =>
    (width > THUMB ? ((minutes - MIN) / (MAX - MIN)) * (width - THUMB) : 0);
