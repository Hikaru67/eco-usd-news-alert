/**
 * Service: Filter economic news events by impact & country
 */
const logger = require('../utils/logger');

/**
 * Filter news events to only keep High-impact USD events
 * @param {Array} events - Raw calendar events from API
 * @returns {Array} Filtered events matching criteria
 */
function filterHighImpactUSD(events) {
    const filtered = events.filter((event) => {
        return event.impact === 'High' && event.country === 'USD';
    });

    logger.info(
        `Filtered ${filtered.length} High-impact USD events from ${events.length} total`
    );
    return filtered;
}

module.exports = { filterHighImpactUSD };
