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

// The backend treats max_time as minutes (it derives max_duration_minutes from
// it). Format compactly: 30m, 1h, 2h, 1h 30m.
export const formatDurationShort = (minutes) => {
    const m = Math.round(Number(minutes));
    if (!Number.isFinite(m) || m <= 0) return null;
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
};

export const formatDurationLong = (minutes) => {
    const m = Math.round(Number(minutes));
    if (!Number.isFinite(m) || m <= 0) return null;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (rem === 0) return `${h} hr`;
    return `${h} hr ${rem} min`;
};

// ---- max stay --------------------------------------------------------------

export const getMaxStay = (spot) => {
    const raw =
        spot?.max_duration_minutes ??
        pick(spot, 'max_time');
    const minutes = raw != null ? parseFloat(raw) : NaN;
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    return {
        minutes,
        short: formatDurationShort(minutes),
        long: formatDurationLong(minutes),
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
 *   kind 'paid'    -> a dollar rate applies (value: "$3.00", unit: "/hr")
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
            unit: '/hr',
            note: paidWindow(spot) || `Zone ${priceZone}`,
        };
    }

    // Some blocks only carry the rate inside the HTML blob. Only call it an
    // hourly rate when the text actually says so — a lot's "$12 daily max"
    // is not "/hr".
    const fromHtml = firstDollarFromHtml(html);
    if (fromHtml) {
        const hourly = /hour|\/\s*hr|per\s*hr/i.test(String(html));
        return {
            kind: 'paid',
            tone: 'text',
            value: fromHtml,
            amount: parseFloat(fromHtml.replace('$', '')) || null,
            unit: hourly ? '/hr' : null,
            note: paidWindow(spot),
        };
    }

    if (htmlSaysFree(html)) {
        return { kind: 'free', tone: 'success', value: 'Free', amount: 0, unit: null, note: paidWindow(spot) };
    }

    // No rate, but a permit zone — this is NOT free to the public.
    if (permitZone) {
        return {
            kind: 'permit',
            tone: 'warning',
            value: 'Permit',
            amount: null,
            unit: null,
            note: `Zone ${permitZone}`,
        };
    }

    return { kind: 'unknown', tone: 'muted', value: 'Check signs', amount: null, unit: null, note: null };
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
        out.push({ key: 'max', tone: 'info', icon: 'timer-outline', text: `${maxStay.short} max` });
    }

    const timeRestriction = pick(spot, 'time_restriction');
    if (hasFlag(timeRestriction) && typeof timeRestriction === 'string') {
        out.push({ key: 'time', tone: 'info', icon: 'clock-alert-outline', text: timeRestriction });
    }

    return out;
};
