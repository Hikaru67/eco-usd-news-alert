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
 * Get the Monday-Sunday range containing a date in the target timezone.
 * @param {Date} referenceDate - Reference instant
 * @returns {{ start: string, end: string }} Date keys in YYYY-MM-DD format
 */
function getWeekRange(referenceDate = new Date()) {
    const dateKey = getDateKey(referenceDate.toISOString());
    const [year, month, day] = dateKey.split('-').map(Number);
    const localDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = localDate.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(localDate);
    monday.setUTCDate(monday.getUTCDate() - daysFromMonday);

    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);

    return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
    };
}

/**
 * Get the date whose 06:00 alert should include this event.
 * Events from 00:00 through 05:59 belong to the previous day's alert.
 *
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Alert date in YYYY-MM-DD format (UTC+7)
 */
function getAlertDateKey(dateStr) {
    const eventDate = new Date(dateStr);
    const shiftedDate = new Date(eventDate.getTime() - 6 * 60 * 60 * 1000);

    return getDateKey(shiftedDate.toISOString());
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
        hourCycle: 'h23',
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

/**
 * Calculate the result check time (1 minute after the event).
 * @param {string} dateStr - ISO 8601 date string of the event
 * @returns {object} { hour, minute, day, month } for the result check
 */
function getEventResultTime(dateStr) {
    const eventDate = new Date(dateStr);
    const resultDate = new Date(eventDate.getTime() + 60 * 1000);

    return getCronComponents(resultDate.toISOString());
}

module.exports = {
    formatDateTime,
    getDateKey,
    getWeekRange,
    getAlertDateKey,
    getCronComponents,
    getEventAlertTime,
    getEventResultTime,
};
