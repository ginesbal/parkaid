// Points on the City's street lines. A block face comes as a MultiLineString
// of [lng, lat] points. Its pin goes halfway along it rather than at its
// first point, a corner, where the blocks around an intersection would all
// put theirs.

const METERS_PER_DEG = 111320;

// Metres between two [lng, lat] points; flat is close enough over a block.
const meters = (a, b) => Math.hypot(
  (b[0] - a[0]) * METERS_PER_DEG * Math.cos((a[1] * Math.PI) / 180),
  (b[1] - a[1]) * METERS_PER_DEG,
);

// Halfway along a (multi)line by length, as [lng, lat]; null without points.
function lineMidpoint(lines) {
  const parts = (Array.isArray(lines) ? lines : []).filter((line) => Array.isArray(line) && line.length);
  if (!parts.length) return null;
  let total = 0;
  for (const line of parts) {
    for (let i = 1; i < line.length; i++) total += meters(line[i - 1], line[i]);
  }
  let left = total / 2;
  for (const line of parts) {
    for (let i = 1; i < line.length; i++) {
      const step = meters(line[i - 1], line[i]);
      if (step > 0 && step >= left) {
        const t = left / step;
        return [
          line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t,
          line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t,
        ];
      }
      left -= step;
    }
  }
  return parts[0][0];
}

module.exports = { lineMidpoint };
