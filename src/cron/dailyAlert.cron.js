/**
 * Daily Alert Cron
 *
 * Responsible for sending Telegram alerts for High-impact USD news
 * on specific days. These cron jobs are dynamically scheduled by
 * the weekly fetch cron (weeklyFetch.cron.js).
 */
const cron = require('node-cron');
const logger = require('../utils/logger');
const { sendNewsAlert, sendSingleEventAlert } = require('../services/telegram.service');
const { formatDateTime, getDateKey, getEventAlertTime } = require('../services/timezone.service');

// Store references to scheduled daily alert tasks so they can be cancelled
const scheduledAlerts = [];

/**
 * Schedule a daily alert for a specific date
 * Sends alert at 07:00 AM (UTC+7) on the given date
 *
 * @param {string} dateKey - Date string in YYYY-MM-DD format (UTC+7)
 * @param {Array} events - Filtered events for that date
 */
function scheduleDailyAlert(dateKey, events) {
    // Parse the date key to extract day, month
    const [year, month, day] = dateKey.split('-').map(Number);

    // Schedule at 07:00 AM on the target date
    // node-cron format: second minute hour dayOfMonth month dayOfWeek
    // Note: node-cron months are 1-12, matching our format
    const cronExpression = `0 0 7 ${day} ${month} *`;

    logger.info(
        `Scheduling alert for ${dateKey} at 07:00 AM (UTC+7) | Cron: ${cronExpression}`
    );
    logger.info(`  → ${events.length} events to alert:`);
    events.forEach((e) => {
        logger.info(`    - ${e.title} at ${formatDateTime(e.date)}`);
    });

    const task = cron.schedule(
        cronExpression,
        async () => {
            try {
                logger.info(`🔔 Daily alert triggered for ${dateKey}`);

                // Format date label for the message
                const dateLabel = `${day.toString().padStart(2, '0')}/${month
                    .toString()
                    .padStart(2, '0')}/${year}`;

                await sendNewsAlert(events, dateLabel);
                logger.info(`✅ Alert sent successfully for ${dateKey}`);
            } catch (error) {
                logger.error(`Failed to send alert for ${dateKey}:`, error.message);
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh', // UTC+7
        }
    );

    scheduledAlerts.push(task);
}

/**
 * Cancel all previously scheduled daily alerts
 * Called before setting up new alerts each week
 */
function cancelAllAlerts() {
    logger.info(`Cancelling ${scheduledAlerts.length} existing daily alerts`);
    scheduledAlerts.forEach((task) => task.stop());
    scheduledAlerts.length = 0; // Clear the array
}

/**
 * Schedule a pre-event alert (5 minutes before the event)
 * Sends alert for a single event at event_time - 5 minutes
 *
 * @param {object} event - Single event object with date, title, etc.
 */
function schedulePreEventAlert(event) {
    // Get alert time (5 minutes before event)
    const { hour, minute, day, month } = getEventAlertTime(event.date);

    // Create cron expression: second minute hour dayOfMonth month dayOfWeek
    const cronExpression = `0 ${minute} ${hour} ${day} ${month} *`;

    const eventTimeStr = formatDateTime(event.date);
    logger.info(
        `Scheduling pre-event alert for "${event.title}" at ${hour}:${minute
            .toString()
            .padStart(2, '0')} (5 min before ${eventTimeStr}) | Cron: ${cronExpression}`
    );

    const task = cron.schedule(
        cronExpression,
        async () => {
            try {
                logger.info(`⏰ Pre-event alert triggered for: ${event.title}`);
                await sendSingleEventAlert(event);
                logger.info(`✅ Pre-event alert sent successfully for: ${event.title}`);
            } catch (error) {
                logger.error(`Failed to send pre-event alert for ${event.title}:`, error.message);
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh', // UTC+7
        }
    );

    scheduledAlerts.push(task);
}

module.exports = { scheduleDailyAlert, schedulePreEventAlert, cancelAllAlerts };
