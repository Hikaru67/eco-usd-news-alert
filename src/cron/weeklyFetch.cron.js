/**
 * Weekly Fetch Cron
 *
 * Runs every Monday at 05:00 AM (UTC+7).
 * 1. Fetches this week's economic calendar from API
 * 2. Filters for High-impact USD events
 * 3. Converts times to UTC+7
 * 4. Groups events by date
 * 5. Schedules daily alert crons for each date with matching events
 */
const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchCalendar } = require('../services/fetchCalendar.service');
const { filterHighImpactUSD } = require('../services/filterNews.service');
const { getDateKey } = require('../services/timezone.service');
const {
    scheduleDailyAlert,
    schedulePreEventAlert,
    cancelAllAlerts,
} = require('./dailyAlert.cron.js');

/**
 * Main logic: fetch, filter, group by date, and schedule alerts
 */
async function fetchAndScheduleAlerts() {
    try {
        logger.info('========================================');
        logger.info('Weekly fetch & schedule started');
        logger.info('========================================');

        // Step 1: Fetch calendar data
        const events = await fetchCalendar();

        // Step 2: Filter High-impact USD events
        const highImpactUSD = filterHighImpactUSD(events);

        if (highImpactUSD.length === 0) {
            logger.info('No High-impact USD events this week. No alerts scheduled.');
            return;
        }

        // Step 3: Group events by date (UTC+7)
        const eventsByDate = {};

        highImpactUSD.forEach((event) => {
            const dateKey = getDateKey(event.date);

            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });

        // Step 4: Cancel old alerts and schedule new daily alerts
        cancelAllAlerts();

        const dates = Object.keys(eventsByDate).sort();
        logger.info(`Scheduling alerts for ${dates.length} date(s): ${dates.join(', ')}`);

        dates.forEach((dateKey) => {
            // Schedule daily summary alert at 07:00 AM
            scheduleDailyAlert(dateKey, eventsByDate[dateKey]);

            // Schedule individual pre-event alerts (5 min before each event)
            eventsByDate[dateKey].forEach((event) => {
                schedulePreEventAlert(event);
            });
        });

        logger.info('========================================');
        logger.info('Weekly fetch & schedule completed');
        logger.info('========================================');
    } catch (error) {
        logger.error('Weekly fetch & schedule failed:', error.message);
    }
}

/**
 * Start the weekly cron job
 * Runs every Monday at 05:00 AM (UTC+7 / Asia/Ho_Chi_Minh)
 */
function startWeeklyCron() {
    // Cron: minute hour dayOfMonth month dayOfWeek
    // "0 5 * * 1" = 05:00 every Monday
    const cronExpression = '0 5 * * 1';

    logger.info(`Weekly fetch cron scheduled: ${cronExpression} (every Monday 05:00 UTC+7)`);

    cron.schedule(cronExpression, fetchAndScheduleAlerts, {
        timezone: 'Asia/Ho_Chi_Minh', // UTC+7
    });
}

module.exports = { startWeeklyCron, fetchAndScheduleAlerts };
