/**
 * Service: Timezone conversion utilities
 *
 * API returns times in ISO 8601 with offset (e.g., -05:00).
 * new Date() automatically parses to UTC internally.
 * We use Intl.DateTimeFormat with the target timezone for correct display,
 * avoiding manual offset arithmetic which can cause double-offset bugs.
 */

const TARGET_TIMEZONE = 'Asia/Ho_Chi_Minh'; // UTC+7

/**
 * Format a date string to a readable string in UTC+7
 * @param {string} dateStr - ISO 8601 date string (e.g., "2026-02-10T08:30:00-05:00")
 * @returns {string} Formatted date string like "10/02/2026 20:30"
 */
function formatDateTime(dateStr) {
    const date = new Date(dateStr);

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: TARGET_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    // Intl formats as "DD/MM/YYYY, HH:mm" — remove the comma
    return formatter.format(date).replace(',', '');
}

/**
 * Get the date part only (YYYY-MM-DD) in UTC+7 from an ISO date string
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Date string like "2026-02-10"
 */
function getDateKey(dateStr) {
    const date = new Date(dateStr);

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: TARGET_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // en-CA locale formats as YYYY-MM-DD
    return formatter.format(date);
}

module.exports = { formatDateTime, getDateKey };

