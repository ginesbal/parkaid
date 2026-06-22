// src/components/ParkingCard/cardHelpers.js

import { getAccess, getCapacity, getMaxStay, getPriceInfo, getSpotType } from '../../utils/spotInfo';
import { logger } from '../../utils/loggers';

// json parsing helpers
export const parseZoneInfo = (spot) => {
    const original = spot?.zone_info;
    let parsed = {};
    if (typeof original === 'string') {
        try {
            parsed = JSON.parse(original);
        } catch (e) {
            logger.log(
                'failed to parse zone_info',
                { error: e?.message, original_preview: original.slice(0, 100) },
                'error'
            );
            parsed = {};
        }
    } else {
        parsed = original || {};
    }
    return parsed;
};

export const parseMetadata = (spot) => {
    const original = spot?.metadata;
    let parsed = {};
    if (typeof original === 'string') {
        try {
            parsed = JSON.parse(original);
        } catch (e) {
            logger.log(
                'failed to parse metadata',
                { error: e?.message, original_preview: original.slice(0, 100) },
                'error'
            );
            parsed = {};
        }
    } else {
        parsed = original || {};
    }
    return parsed;
};

// Turn the city's HTML rate blob into ordered { period, rate } rows.
export const parseHtmlZoneRate = (html) => {
    if (!html) return [];
    const decoded = String(html)
        .replace(/\\u003C/g, '<')
        .replace(/\\u003E/g, '>')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/?b>/g, '');
    const lines = decoded.split('\n').filter((l) => l.trim());
    const out = [];
    let cur = null;
    for (const line of lines) {
        const t = line.trim();
        if (t.includes(':') && !t.includes('$') && !t.toLowerCase().includes('free')) {
            if (cur) out.push(cur);
            cur = { period: t, rate: '' };
        } else if (t.includes('$') || t.toLowerCase().includes('free')) {
            if (cur) {
                cur.rate = t;
                out.push(cur);
                cur = null;
            } else {
                out.push({ period: '', rate: t });
            }
        }
    }
    if (cur?.rate) out.push(cur);
    return out;
};

export const getPricingData = (spot, zoneInfo) => {
    const html = spot?.html_zone_rate || zoneInfo?.html_zone_rate;
    return parseHtmlZoneRate(html);
};

// Values that read as "no, there's nothing here".
const NEGATIVE = new Set(['', 'n', 'no', 'none', '0', 'false', 'null', 'na', 'n/a']);
const isMeaningful = (v) =>
    v != null && !NEGATIVE.has(String(v).trim().toLowerCase());

/**
 * Build the back-of-card detail pages.
 *
 * Everything here reads through a merged view of top-level + zone_info +
 * metadata, because the backend nests most fields. Values are formatted for
 * humans (minutes become "2 hours", price zones become real dollars) rather than
 * dumped raw.
 */
export const getDetailsPages = (spot) => {
    const zone = parseZoneInfo(spot || {});
    const meta = parseMetadata(spot || {});

    // top-level wins, then zone_info, then metadata.
    const field = (key) => {
        if (isMeaningful(spot?.[key])) return spot[key];
        if (isMeaningful(zone?.[key])) return zone[key];
        if (isMeaningful(meta?.[key])) return meta[key];
        return null;
    };

    const access = getAccess(spot || {});
    const price = getPriceInfo(spot || {});
    const maxStay = getMaxStay(spot || {});
    const capacity = getCapacity(spot || {});
    const type = getSpotType(spot || {});

    const pages = [];
    const seen = (items) =>
        Array.from(new Map(items.map((it) => [`${it.label}:${it.value}`, it])).values());

    // 1) Pricing -------------------------------------------------------------
    const pricing = [];
    if (access.kind !== 'public') {
        // Plain language instead of "permit zone R-12".
        pricing.push({ label: 'Access', value: access.label, highlight: true });
    } else if (price.kind === 'paid') {
        pricing.push({ label: 'Rate', value: `${price.value}${price.unit ? ` ${price.unit}` : ''}`, highlight: true });
    } else if (price.kind === 'free') {
        pricing.push({ label: 'Rate', value: 'Free', highlight: true });
    } else {
        pricing.push({ label: 'Rate', value: 'Posted on signs' });
    }

    const enforceable = field('enforceable_time');
    if (enforceable) pricing.push({ label: 'Paid hours', value: enforceable });

    const priceZone = field('price_zone');
    if (priceZone) pricing.push({ label: 'Price zone', value: `Zone ${priceZone}` });

    const permitZone = field('permit_zone');
    if (permitZone) pricing.push({ label: 'Permit zone', value: permitZone });

    const parkingZone = field('parking_zone');
    if (parkingZone) pricing.push({ label: 'Parking zone', value: parkingZone });

    // Detailed rate breakdown from the HTML blob, if the city provided one.
    getPricingData(spot || {}, zone).forEach((row) => {
        if (row.rate) pricing.push({ label: row.period || 'Rate', value: row.rate });
    });

    if (pricing.length > 0) pages.push({ title: 'Pricing', items: seen(pricing) });

    // 2) Rules & restrictions ------------------------------------------------
    const rules = [];
    if (maxStay) rules.push({ label: 'Max stay', value: maxStay.text, highlight: true });

    const noStopping = field('no_stopping');
    if (isMeaningful(noStopping)) {
        rules.push({
            label: 'No stopping',
            value: typeof noStopping === 'string' && noStopping.length > 1 ? noStopping : 'Yes',
        });
    }

    const timeRestriction = field('time_restriction');
    if (timeRestriction) rules.push({ label: 'Time restriction', value: timeRestriction });

    const parkingRestriction = field('parking_restriction');
    if (parkingRestriction) rules.push({ label: 'Restriction', value: parkingRestriction });

    const restrictType = field('parking_restrict_type');
    if (restrictType) rules.push({ label: 'Restriction type', value: restrictType });

    const restrictTime = field('parking_restrict_time');
    if (restrictTime) rules.push({ label: 'Restriction time', value: restrictTime });

    const blockSide = field('block_side');
    if (blockSide) rules.push({ label: 'Block side', value: blockSide });

    if (rules.length > 0) pages.push({ title: 'Rules', items: seen(rules) });

    // 3) About this spot -----------------------------------------------------
    const about = [];
    about.push({ label: 'Type', value: type.label });

    const lotName = field('lot_name');
    if (lotName) about.push({ label: 'Lot name', value: lotName });

    const lotNum = field('lot_num');
    if (lotNum) about.push({ label: 'Lot number', value: lotNum });

    if (capacity) about.push({ label: 'Capacity', value: `${capacity} spaces` });

    const stallType = field('stall_type');
    if (stallType) about.push({ label: 'Stall type', value: stallType });

    const zoneType = field('zone_type');
    if (zoneType) about.push({ label: 'Zone type', value: zoneType });

    const parkingType = field('parking_type');
    if (parkingType) about.push({ label: 'Parking type', value: parkingType });

    const description = field('description');
    if (description) about.push({ label: 'Description', value: description });

    const camera = field('camera');
    if (isMeaningful(camera)) about.push({ label: 'Camera enforced', value: 'Yes' });

    const homePage = field('home_page');
    if (homePage) about.push({ label: 'More info', value: 'Open website', link: homePage });

    if (about.length > 0) pages.push({ title: 'About this spot', items: seen(about) });

    logger.log(
        'details compile done',
        { page_count: pages.length, titles: pages.map((p) => p.title) },
        'data_compilation'
    );

    return pages.length > 0 ? pages : [{ title: 'No additional details', items: [] }];
};
