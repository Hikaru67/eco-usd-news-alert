/**
 * Service: Timezone conversion utilities
 *
 * API returns times in UTC-5 (EST). We need to convert to UTC+7.
 * The difference is +12 hours (from -5 to +7).
 */
const config = require('../config/env');

// API source timezone offset (UTC-5)
const SOURCE_OFFSET = -5;

/**
 * Convert a date string from UTC-5 to the target timezone (UTC+7 by default)
 * @param {string} dateStr - ISO 8601 date string (e.g., "2026-02-10T08:30:00-05:00")
 * @returns {Date} Date object adjusted to target timezone
 */
function convertToTargetTimezone(dateStr) {
    const date = new Date(dateStr);

    // Calculate the offset difference in hours
    // From UTC-5 to UTC+7 = +12 hours
    const offsetDiff = config.timezone.offset - SOURCE_OFFSET;

    // Apply the offset difference (in milliseconds)
    const converted = new Date(date.getTime() + offsetDiff * 60 * 60 * 1000);
    return converted;
}

/**
 * Format a Date object to a readable string in the target timezone
 * @param {Date} date - Date object (already converted to target timezone)
 * @returns {string} Formatted date string like "10/02/2026 20:30"
 */
function formatDateTime(date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Get the date part only (YYYY-MM-DD) from a converted Date
 * @param {Date} date - Date object (already converted to target timezone)
 * @returns {string} Date string like "2026-02-10"
 */
function getDateKey(date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${year}-${month}-${day}`;
}

module.exports = { convertToTargetTimezone, formatDateTime, getDateKey };
