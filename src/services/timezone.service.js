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

/**
 * Get cron components (hour, minute, day, month) from an ISO date string in UTC+7
 * Used to create dynamic cron expressions for scheduling alerts
 * @param {string} dateStr - ISO 8601 date string
 * @returns {object} { hour, minute, day, month } in UTC+7 timezone
 */
function getCronComponents(dateStr) {
    const date = new Date(dateStr);

    // Extract each component in UTC+7 timezone
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TARGET_TIMEZONE,
        hour: 'numeric',
        hour12: false,
    });

    const minuteFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TARGET_TIMEZONE,
        minute: 'numeric',
    });

    const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TARGET_TIMEZONE,
        day: 'numeric',
    });

    const monthFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TARGET_TIMEZONE,
        month: 'numeric',
    });

    return {
        hour: parseInt(hourFormatter.format(date)),
        minute: parseInt(minuteFormatter.format(date)),
        day: parseInt(dayFormatter.format(date)),
        month: parseInt(monthFormatter.format(date)),
    };
}

/**
 * Calculate the alert time (5 minutes before the event) and return cron components
 * @param {string} dateStr - ISO 8601 date string of the event
 * @returns {object} { hour, minute, day, month } for the alert time (5 min before event)
 */
function getEventAlertTime(dateStr) {
    const eventDate = new Date(dateStr);
    
    // Subtract 5 minutes (5 * 60 * 1000 milliseconds)
    const alertDate = new Date(eventDate.getTime() - 5 * 60 * 1000);
    
    // Convert to ISO string and get cron components
    return getCronComponents(alertDate.toISOString());
}

module.exports = { formatDateTime, getDateKey, getCronComponents, getEventAlertTime };

