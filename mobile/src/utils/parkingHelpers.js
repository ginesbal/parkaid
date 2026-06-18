import { getPriceInfo } from './spotInfo';

// Summary stats for the home header: how close is the nearest spot, what does
// paid parking around here run, and how many spots did we find. Shape matches
// what QuickInfoBar reads (nearest / averagePrice / total).
export function calculateQuickInfo(spots) {
    if (!Array.isArray(spots) || spots.length === 0) {
        return { nearest: null, averagePrice: null, total: 0 };
    }

    // Nearest by walk time, falling back to distance when walk time is missing.
    const nearest = spots.reduce((best, spot) => {
        const a = spot?.walkingTime ?? Infinity;
        const b = best?.walkingTime ?? Infinity;
        if (a !== b) return a < b ? spot : best;
        return (spot?.distance ?? Infinity) < (best?.distance ?? Infinity) ? spot : best;
    }, spots[0]);

    // Average only across spots that actually charge, so a street full of
    // permit-only blocks doesn't drag the figure down to near zero.
    const paidRates = spots
        .map((spot) => getPriceInfo(spot))
        .filter((p) => p.kind === 'paid' && p.unit === '/hr' && typeof p.amount === 'number' && p.amount > 0)
        .map((p) => p.amount);

    const averagePrice = paidRates.length
        ? paidRates.reduce((sum, n) => sum + n, 0) / paidRates.length
        : null;

    return {
        nearest,
        averagePrice,
        total: spots.length,
    };
}

// format price for display
export const formatPrice = (price) => {
    if (!price || price === '0' || price === 0) return 'FREE';
    if (typeof price === 'number') return `$${price.toFixed(2)}`;
    return price;
};

// get icon name for filter
export const getFilterIcon = (filter) => {
    const icons = {
        'all': 'view-grid-outline',
        'on_street': 'car',
        'off_street': 'parking',
        'residential': 'home-city-outline'
    };
    return icons[filter] || 'help-circle';
};

// format distance label
export const getDistanceLabel = (meters) => {
    if (!meters && meters !== 0) return '—';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
};

// calculate walking time from distance
export const calculateWalkingTime = (meters) => {
    if (!meters) return null;
    // Average walking speed: 5 km/h = 83 meters/minute
    const minutes = Math.round(meters / 83);
    return minutes;
};

// Sort spots by distance
export const sortByDistance = (spots) => {
    return [...spots].sort((a, b) => a.distance - b.distance);
};

// sort spots by price
export const sortByPrice = (spots) => {
    return [...spots].sort((a, b) => {
        if (!a.price) return 1;
        if (!b.price) return -1;
        return a.price - b.price;
    });
};

// filter free parking spots
export const filterFreeSpots = (spots) => {
    return spots.filter(spot => !spot.price || spot.price === 0);
};