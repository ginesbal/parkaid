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
    if (meters < 1000) return `${meters} m`;
    return `${Number((meters / 1000).toFixed(1))} km`;
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