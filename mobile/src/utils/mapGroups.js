// Pins that would sit on top of one another, gathered into groups. Downtown,
// 45 street blocks can lie within 250 m, and the two sides of a street are a
// few pixels apart until the map is zoomed well in. Each group is led by its
// best spot, in the lists' order, and drawn as one pin with a count; a tap on
// it zooms in until its spots part.

import { distanceMeters } from './geo';
import { getCoordinates } from './spotPresentation';

// Where a point falls on the whole world drawn `worldSize` pixels wide, in
// Web Mercator as both maps draw it. Only the gaps between points matter.
export function worldPoint({ latitude, longitude }, worldSize) {
    const sin = Math.sin((latitude * Math.PI) / 180);
    return {
        x: ((longitude + 180) / 360) * worldSize,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
    };
}

// The world's width in pixels on a map `width` pixels wide that shows
// `longitudeDelta` degrees, as react-native-maps gives its region.
export const worldSizeFor = (longitudeDelta, width) => (360 / longitudeDelta) * width;

// How close two pins may be, centre to centre, before they overlap: about a
// group's pill, a little wider than a price's.
const PIN_WIDTH = 70;
const PIN_HEIGHT = 34;

// `spots` best first. `keep`: a spot drawn on its own whatever lies near it,
// the selected one. Returns [{ key, lead, spots, coordinate }] in the same
// order, where a group of one is a plain pin at its spot.
export function groupPins(spots, worldSize, keep = null) {
    const groups = [];
    for (const spot of spots || []) {
        const coordinate = getCoordinates(spot);
        if (!coordinate) continue;
        const { x, y } = worldPoint(coordinate, worldSize);
        const alone = keep != null && spot.id === keep.id;
        const near = alone
            ? null
            : groups.find((g) => !g.alone && Math.abs(g.x - x) < PIN_WIDTH && Math.abs(g.y - y) < PIN_HEIGHT);
        if (near) near.spots.push(spot);
        else groups.push({ x, y, alone, lead: spot, spots: [spot], coordinate });
    }
    return groups.map(({ lead, spots: members, coordinate }) => ({
        key: members.length > 1 ? `group:${lead.id}:${members.length}` : `spot:${lead.id}`,
        lead,
        spots: members,
        coordinate,
    }));
}

// A group whose spots all lie this close together won't part by zooming in;
// a tap on it picks its lead instead.
const TOO_CLOSE = 12; // metres

export function canPart(group) {
    const points = group.spots.map(getCoordinates).filter(Boolean);
    return points.some((a) => points.some((b) => distanceMeters(a, b) > TOO_CLOSE));
}

// The corners around a group's spots: { north, south, east, west }.
export function groupBounds(group) {
    const points = group.spots.map(getCoordinates).filter(Boolean);
    return {
        north: Math.max(...points.map((p) => p.latitude)),
        south: Math.min(...points.map((p) => p.latitude)),
        east: Math.max(...points.map((p) => p.longitude)),
        west: Math.min(...points.map((p) => p.longitude)),
    };
}
