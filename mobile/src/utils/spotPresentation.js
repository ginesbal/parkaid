// How a parking spot from /api/parking/nearby reads on screen: its name, its
// kind, and its rate. Shared so Home, Map and Details describe a spot the same way.
//
// Address formats in the City of Calgary data:
//   on-street:   "Eau Claire Av SW ,  Fr 4 St SW To 5 St SW"
//   off-street:  "CPA Lot 24: 825 Macleod Trail SE"
//   residential: "00 Block COLLINGWOOD PL NW"

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

// { title, detail }: "Eau Claire Av SW" + "4 St SW to 5 St SW"
export function getSpotName(spot) {
    const address = (spot?.address || '').trim();
    if (!address || address === 'Unknown Address') {
        return { title: getSpotKind(spot), detail: '' };
    }

    const block = address.match(/^(.+?)\s*,\s*Fr\s+(.+?)\s+To\s+(.+)$/i);
    if (block) {
        return { title: block[1].trim(), detail: `${block[2].trim()} to ${block[3].trim()}` };
    }

    const colon = address.indexOf(':');
    if (colon > 0) {
        return { title: address.slice(0, colon).trim(), detail: address.slice(colon + 1).trim() };
    }

    return { title: address, detail: '' };
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

// Numeric hourly rate when the data has one, else null. A 0 from the API means
// "no price zone", not free, so it is treated as unknown.
export function getHourlyRate(spot) {
    const value = Number(spot?.price_per_hour ?? spot?.price);
    return Number.isFinite(value) && value > 0 ? value : null;
}

// { amount: "$5.00", unit: "/ hour" } or { note: "Rates posted at lot" }
export function getRateDisplay(spot) {
    const rate = getHourlyRate(spot);
    if (rate !== null) return { amount: `$${rate.toFixed(2)}`, unit: '/ hour' };
    if (spot?.spot_type === 'residential') return { note: 'Permit holders only' };
    if (spot?.spot_type === 'off_street') return { note: 'Rates posted at lot' };
    return { note: 'Check posted signs' };
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
