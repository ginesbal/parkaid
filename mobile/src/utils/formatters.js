/**
 * format currency amount
 * @param {number} amount - amount in dollars
 * @returns {string} formatted currency (e.g., "$12.50")
 */
export const formatMoney = (amount) => {
    if (!amount || amount <= 0) return '$0.00';
    return `$${amount.toFixed(2)}`;
};

/**
 * Format date to time string
 * @param {Date} date - Date object
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatEndTime = (date) => {
    if (!date) return '--:--';

    try {
        return date.toLocaleTimeString([], {
            hour: 'numeric', // "2:30 PM", not "02:30 PM"
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        return '--:--';
    }
};
