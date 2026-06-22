// src/utils/spotInfo.js
//
// Single source of truth for how a parking spot is presented across the app.
// The list row and the detail card both read from here, so a spot can never
// say "$3.00/hr" in one place and "Zone 3" in another.
//
// The backend nests most fields under `zone_info` and `metadata` (see
// backend/routes/parking.js), with a few promoted to the top level. Every
// reader below checks both, so it works whether a field was promoted or not.

const PRICE_BY_ZONE = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };

// Values that look present but actually mean "no restriction here".
const NEGATIVE_FLAGS = new Set(['', 'n', 'no', 'none', '0', 'false', 'null', 'na', 'n/a']);

// A DB string column counts as a real flag only when it carries meaning.
const hasFlag = (value) => {
    if (value == null) return false;
    if (typeof value === 'boolean') return value;
    return !NEGATIVE_FLAGS.has(String(value).trim().toLowerCase());
};

const zoneOf = (spot) => spot?.zone_info || {};
const metaOf = (spot) => spot?.metadata || {};

// Reach for a field whether it lives at the top level, in zone_info, or in metadata.
const pick = (spot, key) => {
    if (spot?.[key] != null && spot[key] !== '') return spot[key];
    const z = zoneOf(spot);
    if (z[key] != null && z[key] !== '') return z[key];
    const m = metaOf(spot);
    if (m[key] != null && m[key] !== '') return m[key];
    return null;
};

// ---- spot type -------------------------------------------------------------

export const SPOT_TYPES = {
    on_street: { key: 'on_street', label: 'Street', icon: 'road-variant' },
    off_street: { key: 'off_street', label: 'Lot', icon: 'parking' },
    residential: { key: 'residential', label: 'Residential', icon: 'home-city-outline' },
    school: { key: 'school', label: 'School', icon: 'school-outline' },
};

export const getSpotType = (spot) => SPOT_TYPES[spot?.spot_type] || SPOT_TYPES.on_street;

// ---- address ---------------------------------------------------------------

const QUADRANT = /\b(NW|NE|SW|SE)\b/gi;

// Tidy a street string: collapse spaces, title-case SHOUTING text, expand the
// city's "Av" abbreviation, keep quadrants upper-cased.
const tidyStreet = (s) => {
    let t = (s || '').replace(/\s+/g, ' ').trim();
    if (!t) return t;
    if (t === t.toUpperCase()) t = t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    return t.replace(/\bAv\b/g, 'Ave').replace(QUADRANT, (m) => m.toUpperCase());
};

/**
 * The city packs two things into address_desc, in three shapes:
 *   on-street    "Eau Claire Av SW ,  Fr 4 St SW To 5 St SW"
 *   residential  "00 Block COLLINGWOOD PL NW"
 *   off-street   "Zoo West Lot: 1300 Zoo Road NE"
 * Split into a bold primary line (the address) and the street location beneath.
 */
export const parseAddress = (spot) => {
    const raw = String(spot?.address || spot?.address_desc || '').replace(/\s+/g, ' ').trim();
    if (!raw) return { primary: 'Parking spot', secondary: null };

    // off-street lot: "Lot name: address"
    if (raw.includes(':')) {
        const idx = raw.indexOf(':');
        const name = raw.slice(0, idx).trim();
        const addr = raw.slice(idx + 1).trim();
        return { primary: tidyStreet(name), secondary: addr ? tidyStreet(addr) : null };
    }

    // on-street: "STREET , Fr CROSS To CROSS"
    if (raw.includes(',')) {
        const idx = raw.indexOf(',');
        const street = raw.slice(0, idx).trim();
        const block = raw.slice(idx + 1).trim()
            .replace(/^Fr\s+/i, 'From ')
            .replace(/\s+To\s+/i, ' to ');
        return { primary: tidyStreet(street), secondary: block || null };
    }

    // residential: "00 Block STREET NW"
    const block = raw.match(/^(\d+)\s+block\s+(.+)$/i);
    if (block) {
        return { primary: tidyStreet(block[2]), secondary: `${block[1]} block` };
    }

    return { primary: tidyStreet(raw), secondary: null };
};

// ---- duration formatting ---------------------------------------------------

// Spell numbers with units in full words, pluralized: "1 hour", "2 hours".
export const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

// The backend treats max_time as minutes (it derives max_duration_minutes from
// it). Spell durations out fully: "30 minutes", "1 hour", "2 hours",
// "1 hour 30 minutes".
export const formatDuration = (minutes) => {
    const m = Math.round(Number(minutes));
    if (!Number.isFinite(m) || m <= 0) return null;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    const parts = [];
    if (h > 0) parts.push(plural(h, 'hour'));
    if (rem > 0) parts.push(plural(rem, 'minute'));
    return parts.join(' ');
};

// Compact value + unit for a stat cell: whole hours collapse ("2" / "hours"),
// otherwise stay in minutes ("90" / "minutes").
const durationParts = (minutes) => {
    const m = Math.round(Number(minutes));
    if (m % 60 === 0) {
        const h = m / 60;
        return { value: String(h), unit: h === 1 ? 'hour' : 'hours' };
    }
    return { value: String(m), unit: m === 1 ? 'minute' : 'minutes' };
};

// ---- max stay --------------------------------------------------------------

export const getMaxStay = (spot) => {
    const raw =
        spot?.max_duration_minutes ??
        pick(spot, 'max_time');
    const minutes = raw != null ? parseFloat(raw) : NaN;
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    const parts = durationParts(minutes);
    return {
        minutes,
        text: formatDuration(minutes), // "2 hours" — full phrase
        value: parts.value,            // "2"      — for a stat cell
        unit: parts.unit,              // "hours"
    };
};

// ---- capacity --------------------------------------------------------------

export const getCapacity = (spot) => {
    const n = Number(
        spot?.capacity ??
        pick(spot, 'zone_cap') ??
        pick(spot, 'seg_cap') ??
        0
    );
    return Number.isFinite(n) && n > 0 ? n : null;
};

// ---- access: "can I park here?" --------------------------------------------

/**
 * Plain-language answer to whether a regular driver may park here. Avoids
 * jargon like "permit zone R-12" that a visiting driver wouldn't understand.
 *   public     -> anyone can park (no banner needed)
 *   residents  -> permit holders only
 *   no_parking -> stopping not allowed
 */
export const getAccess = (spot) => {
    if (hasFlag(pick(spot, 'no_stopping'))) {
        return {
            kind: 'no_parking',
            tone: 'danger',
            icon: 'sign-direction-remove',
            label: 'No stopping',
            detail: 'Stopping is not allowed along here',
        };
    }
    // A public paid rate means anyone may park (by paying) — never residents-only.
    // NB: `permit_zone` is just a zone id the city stamps on every paid block, so
    // it is NOT a residents-only signal. The real signals are the residential
    // dataset and an explicit "Permit Required" restriction.
    const restriction = pick(spot, 'parking_restriction');
    const permitRequired = typeof restriction === 'string' && /permit/i.test(restriction);
    const isResidential = spot?.spot_type === 'residential';
    if (!pick(spot, 'price_zone') && (isResidential || permitRequired)) {
        return {
            kind: 'residents',
            tone: 'warning',
            icon: 'account-key-outline',
            label: 'Residents only',
            detail: 'Permit parking — not open to the public',
        };
    }
    return { kind: 'public', tone: 'success', icon: 'check-circle-outline', label: 'Open to the public', detail: null };
};

// ---- hours: "when is it paid, and is it paid right now?" --------------------

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const to24h = (h, m, ap) => {
    let hr = parseInt(h, 10);
    if (ap) {
        const p = ap[0].toLowerCase();
        if (p === 'p' && hr !== 12) hr += 12;
        if (p === 'a' && hr === 12) hr = 0;
    }
    return hr + (m ? parseInt(m, 10) / 60 : 0);
};

const fmtHour = (h) => {
    const hr = Math.floor(h) % 24;
    const min = Math.round((h - Math.floor(h)) * 60);
    const ap = hr >= 12 ? 'PM' : 'AM';
    let hh = hr % 12;
    if (hh === 0) hh = 12;
    return min ? `${hh}:${String(min).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
};

const fmtDays = (set) => {
    const arr = [...set].sort((a, b) => a - b);
    if (arr.length === 7) return 'Every day';
    const contiguous = arr.every((d, i) => i === 0 || d === arr[i - 1] + 1);
    if (contiguous && arr.length > 1) return `${DAY_ABBR[arr[0]]}–${DAY_ABBR[arr[arr.length - 1]]}`;
    return arr.map((d) => DAY_ABBR[d]).join(', ');
};

// Parse the city's enforceable-time string into a paid window. The real format
// is "0910-1750 MON-SAT" (HHMM-HHMM, 24h, no colon, days after). Conservative:
// returns null unless it finds a clear time range, so we never invent hours.
const parsePaidWindow = (str) => {
    if (typeof str !== 'string' || !str.trim()) return null;
    const s = str.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

    let start;
    let end;

    // Primary: "0910-1750" (HHMM-HHMM).
    const hhmm = s.match(/\b(\d{3,4})\s*-\s*(\d{3,4})\b/);
    if (hhmm) {
        const toH = (n) => {
            const p = n.padStart(4, '0');
            return parseInt(p.slice(0, 2), 10) + parseInt(p.slice(2), 10) / 60;
        };
        start = toH(hhmm[1]);
        end = toH(hhmm[2]);
    } else {
        // Fallback: "9:00 am - 6:00 pm" / "9 - 6".
        const tm = s.match(
            /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/
        );
        if (!tm) return null;
        start = to24h(tm[1], tm[2], tm[3]);
        end = to24h(tm[4], tm[5], tm[6]);
        if (!tm[3] && !tm[6] && end <= start) end += 12; // "9 - 6" -> 9 AM – 6 PM
    }
    if (!(end > start)) return null;

    let days;
    if (/daily|every ?day|7 days|all week|mon-sun/.test(s)) {
        days = new Set([0, 1, 2, 3, 4, 5, 6]);
    } else {
        const range = s.match(/(sun|mon|tue|wed|thu|fri|sat)\s*-\s*(sun|mon|tue|wed|thu|fri|sat)/);
        if (range) {
            const a = DAY_INDEX[range[1]];
            const b = DAY_INDEX[range[2]];
            days = new Set();
            for (let i = a; ; i = (i + 1) % 7) { days.add(i); if (i === b) break; }
        } else {
            const found = [...s.matchAll(/(sun|mon|tue|wed|thu|fri|sat)/g)].map((m) => DAY_INDEX[m[1]]);
            days = found.length ? new Set(found) : new Set([1, 2, 3, 4, 5, 6]);
        }
    }

    // Open-to-close (e.g. residential "0001-2359") reads as "all day".
    const allDay = start <= 0.5 && end >= 23.5;
    return { days, start, end, allDay };
};

/**
 * The "when" story: the schedule, the max stay, and — when the schedule parses
 * to a real metered window — whether it's paid or free at this exact moment.
 * For public metered parking, outside the enforced window means free.
 */
export const getHours = (spot) => {
    const enforceable = pick(spot, 'enforceable_time');
    const maxStay = getMaxStay(spot);
    const win = parsePaidWindow(enforceable);

    let schedule = null;
    let status = null;

    if (win) {
        schedule = win.allDay
            ? `${fmtDays(win.days)}, all day`
            : `${fmtDays(win.days)}, ${fmtHour(win.start)} – ${fmtHour(win.end)}`;

        if (!win.allDay) {
            const now = new Date();
            const hour = now.getHours() + now.getMinutes() / 60;
            const paidNow = win.days.has(now.getDay()) && hour >= win.start && hour < win.end;
            status = paidNow
                ? { state: 'paid', label: 'Paid right now', detail: `until ${fmtHour(win.end)}` }
                : { state: 'free', label: 'Free right now', detail: `paid ${fmtHour(win.start)}–${fmtHour(win.end)}` };
        }
    } else if (typeof enforceable === 'string' && enforceable.trim()) {
        schedule = enforceable.trim();
    }

    return { schedule, status, maxStay };
};

// Rush-hour tow-away windows ("AM&PM" + "07:00 - 08:30 , 15:30 - 18:00"). These
// are a hard "no parking", separate from the metered window.
export const getRushRestriction = (spot) => {
    const type = pick(spot, 'parking_restrict_type');
    const time = pick(spot, 'parking_restrict_time');
    if (!hasFlag(type) || !hasFlag(time)) return null;
    const value = String(time).replace(/\s*,\s*/g, ', ').replace(/\s*-\s*/g, '–').trim();
    return { label: 'No parking', value };
};

// ---- price -----------------------------------------------------------------

// Pull the first dollar figure out of the city's HTML rate blob.
const firstDollarFromHtml = (html) => {
    if (typeof html !== 'string') return null;
    const match = html.match(/\$\s*\d+(?:\.\d{1,2})?/);
    return match ? match[0].replace(/\s+/g, '') : null;
};

const htmlSaysFree = (html) =>
    typeof html === 'string' && /free/i.test(html) && !/\$/.test(html);

// When is the meter actually enforced? Short, human phrasing for the subtext.
const paidWindow = (spot) => {
    const t = pick(spot, 'enforceable_time');
    return typeof t === 'string' && t.trim() ? t.trim() : null;
};

/**
 * Resolve what a spot costs, honestly.
 *
 *   kind 'paid'    -> a dollar rate applies (value: "$3.00", unit: "per hour")
 *   kind 'free'    -> genuinely free (value: "Free")
 *   kind 'permit'  -> permit holders only; not free to the public (value: "Permit")
 *   kind 'unknown' -> data is incomplete; tell the user to check signs
 *
 * `tone` maps to the theme's semantic colors so callers don't re-derive it.
 */
export const getPriceInfo = (spot) => {
    const priceZone = pick(spot, 'price_zone');
    const html = pick(spot, 'html_zone_rate');

    // Prefer the dollar amount the backend already computed from the price zone.
    const numeric =
        typeof spot?.price_per_hour === 'number' ? spot.price_per_hour :
        typeof spot?.price === 'number' ? spot.price :
        priceZone ? (PRICE_BY_ZONE[String(priceZone)] || 0) : 0;

    if (priceZone && numeric > 0) {
        return {
            kind: 'paid',
            tone: 'text',
            value: `$${numeric.toFixed(2)}`,
            amount: numeric,
            unit: 'per hour',
            perHour: true,
            note: paidWindow(spot) || `Zone ${priceZone}`,
        };
    }

    // Some blocks only carry the rate inside the HTML blob. Only call it an
    // hourly rate when the text actually says so — a lot's "$12 daily max"
    // is not a per-hour rate.
    const fromHtml = firstDollarFromHtml(html);
    if (fromHtml) {
        const hourly = /hour|\/\s*hr|per\s*hr/i.test(String(html));
        return {
            kind: 'paid',
            tone: 'text',
            value: fromHtml,
            amount: parseFloat(fromHtml.replace('$', '')) || null,
            unit: hourly ? 'per hour' : null,
            perHour: hourly,
            note: paidWindow(spot),
        };
    }

    if (htmlSaysFree(html)) {
        return { kind: 'free', tone: 'success', value: 'Free', amount: 0, unit: null, perHour: false, note: paidWindow(spot) };
    }

    return { kind: 'unknown', tone: 'muted', value: 'Rate on signs', amount: null, unit: null, perHour: false, note: null };
};

// ---- restrictions ----------------------------------------------------------

/**
 * The rules a driver would get ticketed for ignoring, in priority order.
 * Each badge: { key, tone: 'danger'|'warning'|'info', icon, text }.
 */
export const getRestrictions = (spot) => {
    const out = [];

    const noStopping = pick(spot, 'no_stopping');
    if (hasFlag(noStopping)) {
        out.push({ key: 'no_stop', tone: 'danger', icon: 'sign-direction-remove', text: 'No stopping' });
    }

    const permitZone = pick(spot, 'permit_zone');
    if (permitZone) {
        out.push({ key: 'permit', tone: 'warning', icon: 'card-account-details-outline', text: `Permit ${permitZone}` });
    }

    const maxStay = getMaxStay(spot);
    if (maxStay) {
        out.push({ key: 'max', tone: 'info', icon: 'timer-outline', text: `${maxStay.text} max` });
    }

    const timeRestriction = pick(spot, 'time_restriction');
    if (hasFlag(timeRestriction) && typeof timeRestriction === 'string') {
        out.push({ key: 'time', tone: 'info', icon: 'clock-alert-outline', text: timeRestriction });
    }

    return out;
};
