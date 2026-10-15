/**
 * Helper functions for the parking timer
 */

/**
 * calculate timer state based on remaining time
 * @param {number|null} remainingMinutes - mins remaining (rounded up), null if unknown
 * @returns {string} timer state: 'active', 'expiring', 'expired'
 */
export const calculateSessionState = (remainingMinutes) => {
    if (remainingMinutes === null || remainingMinutes === undefined) {
        return 'active';
    }

    if (remainingMinutes <= 0) {
        return 'expired';
    }

    if (remainingMinutes <= 10) {
        return 'expiring';
    }

    return 'active';
};

/**
 * calculate cost for a given duration and rate
 * @param {number} minutes - duration in minutes
 * @param {number} hourlyRate - rate per hour
 * @returns {number} total cost
 */
export const calculateCost = (minutes, hourlyRate) => {
    if (!minutes || !hourlyRate) return 0;

    const hours = minutes / 60;
    return Number((hours * hourlyRate).toFixed(2));
};
