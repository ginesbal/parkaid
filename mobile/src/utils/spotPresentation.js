// How a parking spot from /api/parking/nearby reads on screen: its name, its
// kind, and its rate. Shared so Home, Map and Details describe a spot the same way.
//
// Address formats in the City of Calgary data:
//   on-street:   "Eau Claire Av SW ,  Fr 4 St SW To 5 St SW"
//   off-street:  "CPA Lot 24: 825 Macleod Trail SE"
//   residential: "00 Block COLLINGWOOD PL NW"

import { parseChargeHours } from './chargeHours';
import { formatDuration } from './sessionHelpers';

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

// "Street", "Parkade", "Surface lot", "Permit zone"
export function getSpotKind(spot) {
    if (spot?.spot_type === 'off_street') {
        if (isCovered(spot)) return 'Parkade';
        if (/surface/i.test(spot?.metadata?.parking_type || '')) return 'Surface lot';
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

// { title, detail }: "Eau Claire Ave SW" + "4 St SW to 5 St SW"
export function getSpotName(spot) {
    const address = (spot?.address || '').trim();
    if (!address || address === 'Unknown Address') {
        return { title: getSpotKind(spot), detail: '' };
    }

    const block = address.match(BLOCK_FACE);
    if (block) {
        return { title: tidyName(block[1]), detail: `${tidyName(block[2])} to ${tidyName(block[3])}` };
    }

    // Permit zones: "00 Block 6 AV SW" is the 0 to 99 block of 6 Ave SW.
    const hundred = address.match(/^(\d+)\s+Block\s+(.+)$/i);
    if (hundred) {
        const start = Number(hundred[1]);
        return { title: tidyName(hundred[2]), detail: `Block ${start}–${start + 99}` };
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

export function getWalkLabel(spot) {
    const minutes = Number(spot?.walkingTime);
    return Number.isFinite(minutes) && minutes > 0 ? `${minutes} min walk` : null;
}

// A street block's cross streets, short: "4 St to 5 St". A cross street keeps
// its quadrant only when it differs from the block's own ("Centre St S").
export function getCrossStreets(spot) {
    const block = (spot?.address || '').trim().match(BLOCK_FACE);
    if (!block) return null;
    const quadrant = tidyName(block[1]).match(TRAILING_QUADRANT)?.[1];
    const short = (name) => {
        const tidy = tidyName(name);
        return quadrant && tidy.endsWith(` ${quadrant}`) ? tidy.slice(0, -quadrant.length - 1) : tidy;
    };
    return `${short(block[2])} to ${short(block[3])}`;
}

// A posted maximum under this is called out wherever the spot is listed.
const SHORT_LIMIT = 120; // minutes

// "20 min max" when the spot's maximum stay is under 2 hours, else null.
export function getShortLimit(spot) {
    const minutes = getMaxStayMinutes(spot);
    return minutes !== null && minutes < SHORT_LIMIT ? `${formatDuration(minutes)} max` : null;
}

// A list row's second line: the block and the walk for street parking
// ("4 St to 5 St · 3 min walk"), else the kind and the walk.
export function getRowMeta(spot) {
    return [getCrossStreets(spot) || getSpotKind(spot), getWalkLabel(spot)].filter(Boolean).join(' · ');
}

// Numeric hourly rate when the data has one, else null. A 0 from the API means
// "no price zone", not free, so it is treated as unknown.
export function getHourlyRate(spot) {
    const value = Number(spot?.price_per_hour ?? spot?.price);
    return Number.isFinite(value) && value > 0 ? value : null;
}

// { amount: "$5.00", unit: "/ hour" } or { note: "Rates posted at lot", short: "At lot" }.
// `short` fits a narrow price column.
export function getRateDisplay(spot) {
    const rate = getHourlyRate(spot);
    if (rate !== null) return { amount: `$${rate.toFixed(2)}`, unit: '/ hour' };
    if (spot?.spot_type === 'residential') return { note: 'Permit holders only', short: 'Permit' };
    if (spot?.spot_type === 'off_street') return { note: 'Rates posted at lot', short: 'At lot' };
    return { note: 'Check posted signs', short: 'See signs' };
}

// Cheapest known rate first, ties and unknown rates by distance.
export function sortByValue(spots) {
    return [...spots].sort((a, b) => {
        const ra = getHourlyRate(a);
        const rb = getHourlyRate(b);
        if (ra !== null && rb !== null && ra !== rb) return ra - rb;
        if (ra === null && rb !== null) return 1;
        if (rb === null && ra !== null) return -1;
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
}

export function sortByDistance(spots) {
    return [...spots].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

const walkMinutes = (spot) => {
    const minutes = Number(spot?.walkingTime);
    return Number.isFinite(minutes) ? minutes : Math.ceil((spot?.distance ?? Infinity) / 80);
};

// Nearest by walk; for the same walk, the cheaper known rate first (an
// unknown rate after a known one), then the nearer.
export function sortByWalk(spots) {
    return [...spots].sort((a, b) => {
        const wa = walkMinutes(a);
        const wb = walkMinutes(b);
        if (wa !== wb) return wa - wb;
        const ra = getHourlyRate(a);
        const rb = getHourlyRate(b);
        if (ra !== null && rb !== null && ra !== rb) return ra - rb;
        if (ra === null && rb !== null) return 1;
        if (rb === null && ra !== null) return -1;
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
}

// Permit-only blocks after everywhere a visitor can park, unless the driver
// asked for permit zones.
export function permitLast(spots, activeFilter = 'all') {
    if (activeFilter === 'residential') return spots;
    return [
        ...spots.filter((s) => s.spot_type !== 'residential'),
        ...spots.filter((s) => s.spot_type === 'residential'),
    ];
}

// The order every list and map uses for "near": by walk, permit-only last.
export function rankSpots(spots, activeFilter = 'all') {
    return permitLast(sortByWalk(spots || []), activeFilter);
}

// The first spot worth suggesting from an already-sorted list. Permit-only
// blocks are a poor first suggestion unless the driver asked for them.
export function pickTopSpot(spots, activeFilter = 'all') {
    if (!spots?.length) return null;
    if (activeFilter === 'residential') return spots[0];
    return spots.find((s) => s.spot_type !== 'residential') || spots[0];
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
    return m === '00' ? `${h12} ${suffix}` : `${h12}:${m} ${suffix}`;
}

// City format "0910-1750 MON-SAT, 0001-2359 SUN" -> "9:10 AM–5:50 PM, Mon–Sat; all day, Sun".
// Anything it cannot read comes back unchanged.
export function formatEnforceableTime(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    const out = parts.map((part) => {
        const m = part.match(/^(\d{4})-(\d{4})\s+([A-Z]{3})(?:-([A-Z]{3}))?$/i);
        if (!m) return null;
        const [, from, to, d1, d2] = m;
        const days = [d1, d2].filter(Boolean).map((d) => DAY_NAMES[d.toUpperCase()] || d).join('–');
        const allDay = from === '0001' || from === '0000';
        const hours = allDay && (to === '2359' || to === '2400') ? 'all day' : `${clock(from)}–${clock(to)}`;
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
