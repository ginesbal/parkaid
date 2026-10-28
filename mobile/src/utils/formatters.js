/**
 * format duration from minutes to "X HR Y MIN"
 * @param {number} mins - duration in minutes
 * @returns {string} formatted duration ( e.g., "1h 30min", "45min")
 */
export const formatTime = (mins) => {
    if (!mins && mins !== 0) return '--:--';

    if (mins < 60) {
        return `${mins} MIN`;
    }

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    if (minutes === 0) {
        return `${hours} HR`;
    }

    return `${hours} HR ${minutes} MIN`;
};

/**
 * format currency amount
 * @param {number} amount - amount in dollars
 * @returns {string} formatted currency (e.g., "$12.50")
 */
export const formatMoney = (amount) => {
    if (!amount || amount <= 0) return '$0.00';
    return `$${amount.toFixed(2)}`;
};

// A cost that may fall wholly outside charging hours: "$3.00" or "Free".
export const formatCost = (amount) => (amount === 0 ? 'Free' : formatMoney(amount));

// A hint with its last two words joined by a no-break space, so that when it
// wraps, its last line never holds one word alone.
export const noLoneWord = (text) => (typeof text === 'string' ? text.replace(/ (\S+)\s*$/, '\u00A0$1') : text);

/**
 * Format date to time string
 * @param {Date} date - Date object
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatEndTime = (date) => {
    if (!date) return '--:--';

    try {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        return '--:--';
    }
};

/**
 * format date to relative time
 * @param {Date} date - date object
 * @returns {string} relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * format license plate for display
 * @param {string} plate - raw plate string
 * @returns {string} formatted plate (e.g., "ABC-1234")
 */
export const formatPlate = (plate) => {
    if (!plate) return '';

    // remove all non-alphanumeric characters and uppercase
    const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // add hyphen after 3 characters if length > 3
    if (cleaned.length > 3) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }

    return cleaned;
};