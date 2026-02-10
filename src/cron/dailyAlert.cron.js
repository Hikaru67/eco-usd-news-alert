/**
 * Daily Alert Cron
 *
 * Responsible for sending Telegram alerts for High-impact USD news
 * on specific days. These cron jobs are dynamically scheduled by
 * the weekly fetch cron (weeklyFetch.cron.js).
 */
const cron = require('node-cron');
const logger = require('../utils/logger');
const { sendNewsAlert } = require('../services/telegram.service');
const { formatDateTime, getDateKey } = require('../services/timezone.service');

// Store references to scheduled daily alert tasks so they can be cancelled
const scheduledAlerts = [];

/**
 * Schedule a daily alert for a specific date
 * Sends alert at 10:00 AM (UTC+7) on the given date
 *
 * @param {string} dateKey - Date string in YYYY-MM-DD format (UTC+7)
 * @param {Array} events - Filtered events for that date
 */
function scheduleDailyAlert(dateKey, events) {
    // Parse the date key to extract day, month
    const [year, month, day] = dateKey.split('-').map(Number);

    // Schedule at 10:00 AM on the target date
    // node-cron format: second minute hour dayOfMonth month dayOfWeek
    // Note: node-cron months are 1-12, matching our format
    const cronExpression = `0 0 10 ${day} ${month} *`;

    logger.info(
        `Scheduling alert for ${dateKey} at 10:00 AM (UTC+7) | Cron: ${cronExpression}`
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

module.exports = { scheduleDailyAlert, cancelAllAlerts };
