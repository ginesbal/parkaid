// How a parking spot from /api/parking/nearby reads on screen: its name, its
// kind, and its rate. Shared so Home, Map and Details describe a spot the same way.
//
// Address formats in the City of Calgary data:
//   on-street:   "Eau Claire Av SW ,  Fr 4 St SW To 5 St SW"
//   off-street:  "CPA Lot 24: 825 Macleod Trail SE"
//   residential: "00 Block COLLINGWOOD PL NW"

import { formatChargeStart, isChargedAt, nextChargedAt, parseChargeHours } from './chargeHours';
import { nextRateChange, periodAt } from './rates';
import { formatTimeRange, nextRestriction, parseRestrictions, restrictionAt } from './restrictions';
import { formatClock, formatDuration } from './sessionHelpers';

const KIND_LABELS = {
    on_street: 'Street',
    off_street: 'Lot',
    residential: 'Permit zone',
    school: 'School zone',
};

export function isCovered(spot) {
    return spot?.spot_type === 'off_street'
        && /parkade/i.test(spot?.metadata?.parking_type || '');
}

// Street zones that aren't ordinary paid parking, by the City's zone type.
const ZONE_KINDS = { 'Loading Zone': 'Loading zone', 'Handicapped Zone': 'Accessible parking' };

// Only for cars with a disability parking placard.
export const isPlacardOnly = (spot) => spot?.zone_info?.zone_type === 'Handicapped Zone';
// For loading and unloading: free, and for a short stop.
export const isLoadingZone = (spot) => spot?.zone_info?.zone_type === 'Loading Zone';

// "Street", "Loading zone", "Parkade", "Surface lot", "Permit zone"
export function getSpotKind(spot) {
    if (spot?.spot_type === 'off_street') {
        if (isCovered(spot)) return 'Parkade';
        if (/surface/i.test(spot?.metadata?.parking_type || '')) return 'Surface lot';
    }
    if (spot?.spot_type === 'on_street' && ZONE_KINDS[spot?.zone_info?.zone_type]) {
        return ZONE_KINDS[spot.zone_info.zone_type];
    }
    return KIND_LABELS[spot?.spot_type] || 'Parking';
}

// Words kept in capitals when a shouted City name is put in title case.
const KEEP_CAPS = new Set(['NW', 'NE', 'SW', 'SE', 'CPA', 'MEC', 'YMCA']);

// The City writes street types as codes ("AV", "Tr", "Wy"), and sometimes in
// full. People write "Ave", "Trail", "Way": each type gets one spelling.
const STREET_TYPES = new Map([
    ['Ave', 'av ave avenue'], ['St', 'st street'], ['Rd', 'rd road'], ['Dr', 'dr drive'],
    ['Blvd', 'bv blvd boulevard'], ['Cres', 'cr cres crescent'], ['Pl', 'pl place'],
    ['Sq', 'sq square'], ['Trail', 'tr trail'], ['Way', 'wy way'], ['Lane', 'ln lane'],
    ['Close', 'cl close'], ['Court', 'co ct court'], ['Circle', 'ci circle'], ['Gate', 'ga gate'],
    ['Bay', 'ba bay'], ['Hill', 'hl hill'], ['Green', 'gr green'], ['Rise', 'ri rise'],
    ['Heights', 'ht hts heights'], ['Point', 'pt point'], ['Park', 'pa park'], ['Manor', 'mr manor'],
    ['Gardens', 'gd gardens'], ['Link', 'li link'], ['Path', 'ph path'], ['Parade', 'pr parade'],
    ['Common', 'cm common'], ['Heath', 'he heath'], ['Mews', 'me mews'], ['Landing', 'ld landing'],
    ['View', 'vw view'], ['Walk', 'wk walk'], ['Terrace', 'tc terrace'],
].flatMap(([word, codes]) => codes.split(' ').map((code) => [code, word])));

// The street type is the word before the quadrant ("Eau Claire Av SW"), or
// the last word when there is none ("Kensington Rd").
const STREET_TYPE = /\b([A-Za-z]+)\.?(?=\s+(?:NW|NE|SW|SE|N|S|E|W)\b|\s*$)/g;
// Numbered streets lose the ordinal, as on the City's street blocks: "6 St".
const NUMBERED_STREET = /\b(\d+)(?:st|nd|rd|th)?\s+(Street|St|Avenue|Ave|Av)\b/gi;
const QUADRANT = /\b(nw|ne|sw|se)\b/gi;
const SHOUTED = /^[A-Z][A-Z']+$/;

// "6 AV SW" -> "6 Ave SW", "MacLeod Tr SE" -> "MacLeod Trail SE",
// "WINDSOR Cr SW" -> "Windsor Cres SW", "455 6th St SW" -> "455 6 St SW", so
// every list names a street the same way. Shouted words are put in title case.
export function tidyName(text) {
    const value = (text || '').replace(/\s+/g, ' ').trim()
        .split(' ')
        .map((word) => (
            SHOUTED.test(word) && !KEEP_CAPS.has(word) ? word.charAt(0) + word.slice(1).toLowerCase() : word
        ))
        .join(' ')
        .replace(QUADRANT, (quadrant) => quadrant.toUpperCase())
        .replace(NUMBERED_STREET, (_, number, kind) => `${number} ${STREET_TYPES.get(kind.toLowerCase())}`);
    return value.replace(STREET_TYPE, (word, kind) => STREET_TYPES.get(kind.toLowerCase()) ?? word);
}

// A street block: "Eau Claire Av SW ,  Fr 4 St SW To 5 St SW".
const BLOCK_FACE = /^(.+?)\s*,\s*Fr\s+(.+?)\s+To\s+(.+)$/i;
const TRAILING_QUADRANT = /\s(NW|NE|SW|SE|N|S|E|W)$/;

// Which side of the street a block's zone is on, from the City's block_side:
// "north side", or null. A block often has a zone on each side, each with its
// own rate and rules.
const SIDES = { N: 'north side', S: 'south side', E: 'east side', W: 'west side' };
export function getBlockSide(spot) {
    if (spot?.spot_type !== 'on_street') return null;
    return SIDES[String(spot?.metadata?.block_side ?? '').trim().toUpperCase()] ?? null;
}

// { title, detail }: "Eau Claire Ave SW" + "4 St SW to 5 St SW, north side"
export function getSpotName(spot) {
    const address = (spot?.address || '').trim();
    if (!address || address === 'Unknown Address') {
        return { title: getSpotKind(spot), detail: '' };
    }

    const block = address.match(BLOCK_FACE);
    if (block) {
        const cross = `${tidyName(block[2])} to ${tidyName(block[3])}`;
        return { title: tidyName(block[1]), detail: [cross, getBlockSide(spot)].filter(Boolean).join(', ') };
    }

    // Permit zones: "00 Block 6 AV SW" is 6 Ave SW from address 0 to 99.
    const hundred = address.match(/^(\d+)\s+Block\s+(.+)$/i);
    if (hundred) {
        const start = Number(hundred[1]);
        return { title: tidyName(hundred[2]), detail: `Addresses ${start}–${start + 99}` };
    }

    const colon = address.indexOf(':');
    if (colon > 0) {
        return { title: tidyName(address.slice(0, colon)), detail: tidyName(address.slice(colon + 1)) };
    }

    return { title: tidyName(address), detail: '' };
}

// The ParkPlus zone a driver types to pay. On-street only.
export function getZoneLabel(spot) {
    const zone = spot?.zone_info?.parking_zone;
    return spot?.spot_type === 'on_street' && zone ? `Zone ${zone}` : null;
}

// Whether a session is at `spot`: the spot it was started at, or another
// stretch of the same street zone, which is paid for as one.
export function isParkedAt(session, spot) {
    if (!session || !spot) return false;
    if (session.parkingSpotId != null && String(session.parkingSpotId) === String(spot.id)) return true;
    const zone = getZoneLabel(spot);
    return zone !== null && session.spotId === zone;
}

// A place's name for a sentence: "9 Ave SW", or "10 Ave SW, 4 St SW to 5 St
// SW, north side" when the other place it is told apart from has the same
// street name.
export function nameApart(title, detail, otherTitle) {
    return title && title === otherTitle && detail ? `${title}, ${detail}` : title;
}

export function getWalkLabel(spot) {
    const minutes = Number(spot?.walkingTime);
    return Number.isFinite(minutes) && minutes > 0 ? `${minutes} min walk` : null;
}

// Two numbered streets of one kind: "4 St", "10 Ave", "9A St".
const NUMBERED = /^(\d+[A-Z]?) (St|Ave)$/;

// A street block's cross streets, short: "4–5 St" between numbered streets
// of one kind, else "Centre St S to 1 St". A cross street keeps its quadrant
// only when it differs from the block's own ("Centre St S").
export function getCrossStreets(spot) {
    const block = (spot?.address || '').trim().match(BLOCK_FACE);
    if (!block) return null;
    const quadrant = tidyName(block[1]).match(TRAILING_QUADRANT)?.[1];
    const short = (name) => {
        const tidy = tidyName(name);
        return quadrant && tidy.endsWith(` ${quadrant}`) ? tidy.slice(0, -quadrant.length - 1) : tidy;
    };
    const from = short(block[2]);
    const to = short(block[3]);
    const a = from.match(NUMBERED);
    const b = to.match(NUMBERED);
    return a && b && a[2] === b[2] ? `${a[1]}${RANGE_DASH}${b[1]} ${a[2]}` : `${from} to ${to}`;
}

// A street block, short: its cross streets and side, "4–5 St, north side";
// null for lots and permit zones. The side never splits across lines.
export function getBlockLabel(spot) {
    const cross = getCrossStreets(spot);
    const side = getBlockSide(spot);
    return cross ? [cross, side && oneLine(side)].filter(Boolean).join(', ') : null;
}

// A posted maximum under this is called out wherever the spot is listed.
const SHORT_LIMIT = 120; // minutes

// Kept on one line wherever it wraps.
const oneLine = (text) => text.replace(/ /g, '\u00A0');

// "20 min max" when the spot's maximum stay is under 2 hours, else null. With
// no-break spaces, so it never splits across lines.
export function getShortLimit(spot) {
    const minutes = getMaxStayMinutes(spot);
    return minutes !== null && minutes < SHORT_LIMIT
        ? oneLine(`${formatDuration(minutes)} max`)
        : null;
}

// When nobody may park on a street block (rush hour, weekdays), as windows
// (see utils/restrictions); null when never.
export function getRestrictions(spot) {
    return spot?.spot_type === 'on_street' ? parseRestrictions(spot?.zone_info?.parking_restrict_time) : null;
}

export function isRestrictedNow(spot, now = Date.now()) {
    return restrictionAt(getRestrictions(spot), now) !== null;
}

// How long a driver arriving `now` may stay, and why: { minutes, reason, until }.
//   restricted:  no parking now; `until` is when that ends (minutes is 0)
//   restriction: the next restriction starts before the posted maximum runs
//                out; `until` is when it starts, `ends` when it lifts
//   max:         the posted maximum
// null when nothing limits the stay.
export function getStayLimit(spot, now = Date.now()) {
    const windows = getRestrictions(spot);
    const current = restrictionAt(windows, now);
    if (current) return { minutes: 0, reason: 'restricted', until: current.end };
    const max = getMaxStayMinutes(spot);
    const next = nextRestriction(windows, now);
    // Rounded up, like time left: a stay is cut off at the restriction itself.
    const toNext = next ? Math.ceil((next.start.getTime() - new Date(now).getTime()) / 60000) : null;
    if (toNext !== null && (max === null || toNext < max)) {
        return { minutes: toNext, reason: 'restriction', until: next.start, ends: next.end };
    }
    return max !== null ? { minutes: max, reason: 'max' } : null;
}

// What a list says in amber, if anything, most pressing first: no parking
// now, no parking soon, placard holders only, a loading zone, or a posted
// maximum under 2 hours.
export function getCaution(spot, now = Date.now()) {
    const limit = getStayLimit(spot, now);
    if (limit?.reason === 'restricted') return oneLine(`No parking until ${formatClock(limit.until)}`);
    if (limit?.reason === 'restriction' && limit.minutes < SHORT_LIMIT) {
        return oneLine(`No parking from ${formatClock(limit.until)}`);
    }
    if (isPlacardOnly(spot)) return oneLine('Placard holders only');
    if (isLoadingZone(spot)) return oneLine('Loading zone');
    return getShortLimit(spot);
}

// The line under a street spot's rate on Details: { text, tone } or null.
// The rate above it says "Free now" or "No parking now"; this says what
// comes next.
//   warning: until when there's no parking, or when it stops, soon or
//            before the City next charges
//   plain:   when the City starts charging, and at what rate, or when the
//            rate changes in the next 2 hours
export function getNowLine(spot, now = Date.now()) {
    const restrictions = getRestrictions(spot);
    const current = restrictionAt(restrictions, now);
    if (current) return { tone: 'warning', text: `Until ${formatClock(current.end)}` };
    const next = nextRestriction(restrictions, now);
    const charge = getChargeHours(spot);
    const periods = getRatePeriods(spot);
    if (charge && !isChargedAt(charge, now)) {
        const charged = nextChargedAt(charge, now);
        if (next && (!charged || next.start < charged)) {
            return { tone: 'warning', text: `No parking from ${formatChargeStart(next.start, now)}` };
        }
        if (!charged) return null;
        const rate = periodAt(periods, charged)?.rate;
        return {
            tone: 'plain',
            text: `Charged from ${formatChargeStart(charged, now)}${rate ? `, ${formatHourly(rate)}` : ''}`,
        };
    }
    if (next && next.start.getTime() - new Date(now).getTime() < SHORT_LIMIT * 60000) {
        return { tone: 'warning', text: `No parking from ${formatClock(next.start)}` };
    }
    const change = nextRateChange(periods, charge, now, SHORT_LIMIT);
    if (change?.rate === 0) return { tone: 'plain', text: `Free from ${formatClock(change.at)}` };
    if (change?.rate) return { tone: 'plain', text: `${formatHourly(change.rate)} from ${formatClock(change.at)}` };
    return null;
}

// A list row's second line: the block and the walk for street parking
// ("4–5 St, north side · 3 min walk"), else the kind and the walk. With
// `withZone`, the zone too ("· Zone 3367 ·"), for a row that would otherwise
// read like another (see getZoneShown). When it wraps, the walk moves down
// whole.
export function getRowMeta(spot, options) {
    return getRowMetaParts(spot, options).join(' · ');
}

// The same line as its parts, for components/MetaLine.
export function getRowMetaParts(spot, { withZone = false } = {}) {
    const walk = getWalkLabel(spot);
    const zone = withZone ? getZoneLabel(spot) : null;
    return [getBlockLabel(spot) || getSpotKind(spot), zone && oneLine(zone), walk && oneLine(walk)].filter(Boolean);
}

// The street spots in a list that share their street and side of the block
// with another: often several zones in a row, or a loading zone. Their rows
// add the zone, the number on each sign, so no two read the same. A Set of ids.
export function getZoneShown(spots) {
    const sides = new Map();
    for (const spot of spots || []) {
        if (!getZoneLabel(spot)) continue;
        const key = `${getSpotName(spot).title}|${getBlockLabel(spot)}`;
        sides.set(key, [...(sides.get(key) || []), spot.id]);
    }
    return new Set([...sides.values()].filter((ids) => ids.length > 1).flat());
}

// The City's rates by time of day (utils/rates), or null when unknown.
export function getRatePeriods(spot) {
    const periods = spot?.spot_type === 'on_street' ? spot?.rates?.periods : null;
    return Array.isArray(periods) && periods.length ? periods : null;
}

// "$2.25 an hour"
export const formatHourly = (rate) => `$${rate.toFixed(2)} an hour`;

// The hourly rate as of `now`: a number, 0 while the City is not charging,
// or null when it is and no rate is known (lots, permit zones, a zone with
// no published rate). Never anything else: no price is made up.
export function getHourlyRate(spot, now = Date.now()) {
    if (spot?.spot_type !== 'on_street') return null;
    const charge = getChargeHours(spot);
    if (charge && !isChargedAt(charge, now)) return 0;
    return periodAt(getRatePeriods(spot), now)?.rate ?? null;
}

// The rate as of `now`, to show: { amount: "$2.25", unit: "/ hour" },
// { amount: "Free", unit: "now" }, or { note: "Rates posted at lot", short:
// "Rates at lot" }; `short` fits a narrow price column, `spoken` is for
// screen readers.
export function getRateDisplay(spot, now = Date.now()) {
    if (spot?.spot_type === 'residential') return { note: 'Permit holders only', short: 'Permit', spoken: 'Permit holders only' };
    if (spot?.spot_type === 'off_street') return { note: 'Rates posted at lot', short: 'Rates at lot', spoken: 'Rates posted at lot' };
    if (isRestrictedNow(spot, now)) return { note: 'No parking now', short: 'No parking', spoken: 'No parking now' };
    const rate = getHourlyRate(spot, now);
    if (rate === 0) return { amount: 'Free', unit: 'now', spoken: 'Free now' };
    if (rate !== null) {
        const amount = `$${rate.toFixed(2)}`;
        return { amount, unit: '/ hour', spoken: `${amount} per hour` };
    }
    return { note: 'Check posted signs', short: 'See signs', spoken: 'Check posted signs' };
}

// A day's paid stretches: the City's rate periods, cut to the hours it
// charges (when known), earliest first.
function paidStretches(periods, charge, weekday) {
    const stretches = [];
    for (const p of periods) {
        if (!p.days.includes(weekday) || !(p.rate > 0)) continue;
        const windows = charge ? charge.filter((w) => w.days.includes(weekday)) : [p];
        for (const w of windows) {
            const from = Math.max(p.from, w.from);
            const to = Math.min(p.to, w.to);
            if (to > from) stretches.push({ from, to, rate: p.rate, dayMax: p.dayMax });
        }
    }
    return stretches.sort((a, b) => a.from - b.from);
}

// What the City charges an hour here on the next day it charges, from
// today once today's charging is over: { day: "today" | "tomorrow" |
// "Monday", rows: [{ time: "9:10–11 AM", rate: "$3.75" }], dayMax: "$6.00"
// or null }. Neighbouring stretches at one rate are joined. null without
// rates, or when they are all free.
export function getDayRates(spot, now = Date.now()) {
    const periods = getRatePeriods(spot);
    if (!periods) return null;
    const charge = getChargeHours(spot);
    const start = new Date(now);
    const minute = start.getHours() * 60 + start.getMinutes();
    for (let i = 0; i < 7; i++) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const paid = paidStretches(periods, charge, day.getDay());
        if (!paid.length || (i === 0 && paid[paid.length - 1].to <= minute)) continue;
        const rows = [];
        for (const p of paid) {
            const last = rows[rows.length - 1];
            if (last && last.to === p.from && last.rate === p.rate) last.to = p.to;
            else rows.push({ from: p.from, to: p.to, rate: p.rate });
        }
        const caps = paid.map((p) => p.dayMax).filter(Boolean);
        return {
            day: i === 0 ? 'today' : i === 1 ? 'tomorrow' : day.toLocaleDateString([], { weekday: 'long' }),
            rows: rows.map((r) => ({
                time: r.from === 0 && r.to === 24 * 60 ? 'All day' : formatTimeRange(r.from, r.to),
                rate: `$${r.rate.toFixed(2)}`,
            })),
            dayMax: caps.length ? `$${Math.max(...caps).toFixed(2)}` : null,
        };
    }
    return null;
}

// A known rate before an unknown one, the cheaper first; 0 when they tie.
const byRate = (a, b, now) => {
    const ra = getHourlyRate(a, now);
    const rb = getHourlyRate(b, now);
    if (ra !== null && rb !== null) return ra - rb;
    if (ra === null && rb !== null) return 1;
    if (rb === null && ra !== null) return -1;
    return 0;
};

// Cheapest rate now first, ties and unknown rates by distance.
export function sortByValue(spots, now = Date.now()) {
    return [...spots].sort((a, b) => byRate(a, b, now) || (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

export function sortByDistance(spots) {
    return [...spots].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

const walkMinutes = (spot) => {
    const minutes = Number(spot?.walkingTime);
    return Number.isFinite(minutes) ? minutes : Math.ceil((spot?.distance ?? Infinity) / 80);
};

// Nearest by walk; for the same walk, the cheaper rate now first (an
// unknown rate after a known one), then the nearer.
export function sortByWalk(spots, now = Date.now()) {
    return [...spots].sort((a, b) => (
        walkMinutes(a) - walkMinutes(b)
        || byRate(a, b, now)
        || (a.distance ?? Infinity) - (b.distance ?? Infinity)
    ));
}

// Anyone may park here: not a permit zone, not placard holders only.
const forEveryone = (spot) => spot.spot_type !== 'residential' && !isPlacardOnly(spot);

// Permit-only and placard-only blocks after everywhere anyone can park, in
// that order, unless the driver asked for permit zones.
export function permitLast(spots, activeFilter = 'all') {
    if (activeFilter === 'residential') return spots;
    return [
        ...spots.filter(forEveryone),
        ...spots.filter(isPlacardOnly),
        ...spots.filter((s) => s.spot_type === 'residential'),
    ];
}

// Under an hour suits a quick stop, not most trips: a short posted maximum,
// a restriction starting soon, or a loading zone.
const BRIEF_LIMIT = 60; // minutes
const isBrief = (spot, now) => {
    if (isLoadingZone(spot)) return true;
    const limit = getStayLimit(spot, now);
    return limit !== null && limit.reason !== 'restricted' && limit.minutes < BRIEF_LIMIT;
};

// Blocks where a stay can't last an hour after the rest, in the same order.
export function briefLast(spots, now = Date.now()) {
    return [...spots.filter((s) => !isBrief(s, now)), ...spots.filter((s) => isBrief(s, now))];
}

// Blocks nobody may park on right now after the rest, in the same order.
export function restrictedLast(spots, now = Date.now()) {
    return [...spots.filter((s) => !isRestrictedNow(s, now)), ...spots.filter((s) => isRestrictedNow(s, now))];
}

// The order every list and map uses for "near": by walk, then blocks where a
// stay can't last an hour, then no parking right now, permit-only last.
export function rankSpots(spots, activeFilter = 'all', now = Date.now()) {
    return permitLast(restrictedLast(briefLast(sortByWalk(spots || [], now), now), now), activeFilter);
}

// The same, cheapest known rate first.
export function rankByValue(spots, activeFilter = 'all', now = Date.now()) {
    return permitLast(restrictedLast(briefLast(sortByValue(spots || [], now), now), now), activeFilter);
}

// The first spot worth suggesting from an already-sorted list. Permit-only
// blocks are a poor first suggestion unless the driver asked for them, and
// so is a stay under an hour while anything else is open to them. A block
// nobody may park on right now is never suggested.
export function pickTopSpot(spots, activeFilter = 'all', now = Date.now()) {
    if (!spots?.length) return null;
    if (activeFilter === 'residential') return spots[0];
    const open = spots.filter((s) => forEveryone(s) && !isRestrictedNow(s, now));
    return open.find((s) => !isBrief(s, now)) || open[0] || spots.find((s) => !isRestrictedNow(s, now)) || null;
}

// "2 hour maximum", "90 minute maximum": how a posted limit is said
// everywhere (Details, setup, the capped session).
export function formatMaxStay(minutes) {
    if (minutes % 60 === 0) return `${minutes / 60} hour maximum`;
    return `${Math.round(minutes)} minute maximum`;
}

// The spot's posted maximum, said as above, or null.
export function getMaxStayLabel(spot) {
    const minutes = Number(spot?.max_duration_minutes ?? spot?.metadata?.max_time);
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    return formatMaxStay(minutes);
}

export function getMaxStayMinutes(spot) {
    const minutes = Number(spot?.max_duration_minutes ?? spot?.metadata?.max_time);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

const DAY_NAMES = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };

function clock(hhmm) {
    const h = Number(hhmm.slice(0, 2));
    const m = hhmm.slice(2);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    // A no-break space, so "PM" never wraps onto a line of its own.
    return m === '00' ? `${h12} ${suffix}` : `${h12}:${m} ${suffix}`;
}

// City format "0910-1750 MON-SAT, 0001-2359 SUN" -> "9:10 AM–5:50 PM, Mon–Sat; all day, Sun".
// Anything it cannot read comes back unchanged.
const RANGE_DASH = '–⁠';

export function formatEnforceableTime(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    const out = parts.map((part) => {
        const m = part.match(/^(\d{4})-(\d{4})\s+([A-Z]{3})(?:-([A-Z]{3}))?$/i);
        if (!m) return null;
        const [, from, to, d1, d2] = m;
        // A word joiner after each dash: "Mon–Sat" never splits after "Mon–".
        const days = [d1, d2].filter(Boolean).map((d) => DAY_NAMES[d.toUpperCase()] || d).join(RANGE_DASH);
        const allDay = from === '0001' || from === '0000';
        const hours = allDay && (to === '2359' || to === '2400') ? 'all day' : `${clock(from)}${RANGE_DASH}${clock(to)}`;
        return `${hours}, ${days}`;
    });
    if (out.some((o) => o === null)) return raw;
    const text = out.join('; ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// When the City charges at a street spot (see utils/chargeHours); null when
// the data does not say, as for lots.
export function getChargeHours(spot) {
    return parseChargeHours(spot?.zone_info?.enforceable_time);
}

export function getCoordinates(spot) {
    const c = spot?.coordinates?.coordinates;
    if (!Array.isArray(c) || typeof c[0] !== 'number' || typeof c[1] !== 'number') return null;
    return { latitude: c[1], longitude: c[0] };
}

export function getDirectionsUrl(spot) {
    const coords = getCoordinates(spot);
    return coords
        ? `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`
        : null;
}
