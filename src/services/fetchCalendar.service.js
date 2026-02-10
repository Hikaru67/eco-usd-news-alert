/**
 * Service: Fetch economic calendar data from Fair Economy API
 */
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Fetch this week's economic calendar JSON from the API
 * @returns {Promise<Array>} Array of calendar event objects
 */
async function fetchCalendar() {
    try {
        logger.info('Fetching economic calendar from API...');
        const response = await axios.get(config.api.calendarUrl, {
            timeout: 10000, // 10s timeout
        });

        const data = response.data;
        logger.info(`Fetched ${data.length} events from calendar API`);
        return data;
    } catch (error) {
        logger.error('Failed to fetch calendar data:', error.message);
        throw error;
    }
}

module.exports = { fetchCalendar };
