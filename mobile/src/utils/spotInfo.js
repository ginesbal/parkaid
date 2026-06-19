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
    const permitZone = pick(spot, 'permit_zone');
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

    // No rate, but a permit zone — this is NOT free to the public.
    if (permitZone) {
        return {
            kind: 'permit',
            tone: 'warning',
            value: 'Permit',
            amount: null,
            unit: null,
            perHour: false,
            note: `Zone ${permitZone}`,
        };
    }

    return { kind: 'unknown', tone: 'muted', value: 'Check signs', amount: null, unit: null, perHour: false, note: null };
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
