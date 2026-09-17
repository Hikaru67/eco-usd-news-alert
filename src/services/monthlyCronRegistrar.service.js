/**
 * Service: Register cron jobs for the generated schedule
 * 
 * Manages the list of active cron jobs for the monthly schedule.
 * Provides functions to clear existing jobs and register new ones.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config/env');
const { sendMessage } = require('./telegram.service');
const { formatDateTime } = require('./timezone.service');

// Store active cron tasks to allow clearing them later
let activeCronTasks = [];

/**
 * Clear all currently registered monthly schedule cron jobs
 */
function clearScheduledJobs() {
    if (activeCronTasks.length > 0) {
        logger.info(`Stopping ${activeCronTasks.length} active scheduled background jobs...`);
        activeCronTasks.forEach(task => task.stop());
        activeCronTasks = [];
    }
}

/**
 * Register a list of dates as cron jobs
 * @param {Array<Date>} scheduleDates - List of Date objects to schedule
 */
function registerMonthlySchedule(scheduleDates) {
    // 1. Clear existing jobs first
    clearScheduledJobs();

    if (!scheduleDates || scheduleDates.length === 0) {
        logger.info('No dates to schedule for this month.');
        return;
    }

    logger.info(`Registering ${scheduleDates.length} alert jobs for this month...`);

    const { name, level } = config.scheduler;

    scheduleDates.forEach(date => {
        // Calculate alert time: 3 minutes before the target time
        const alertTime = new Date(date.getTime() - 3 * 60 * 1000);

        // Only schedule if alert time is in the future
        if (alertTime > new Date()) {
            const cronExpression = getCronExpressionFromDate(alertTime);

            // Create cron task
            // Note: node-cron uses machine's local time by default unless timezone is specified.
            // Since our 'date' object is a JS Date (absolute timestamp), 
            // extracting Minutes/Hours/Month/Day from it using local system time 
            // might be incorrect if the server timezone differs from our intended logic.
            // 
            // However, node-cron's `schedule(date)` accepts a Date object directly!
            // Wait, does node-cron accept a Date object?
            // Checking docs/common usage: usually it takes a cron expression.
            // But 'cron' libraries often allow specific Dates.
            // `node-cron` checks input. If it's a date, it might not work standardly. 
            // Best practice with node-cron is to convert Date to cron expression: "ss mm HH dd MM *"

            const task = cron.schedule(cronExpression, async () => {
                try {
                    const message = buildAlertMessage(date, name, level);
                    await sendMessage(message, config.telegram.btcTopicId);
                    logger.info(`Alert sent for ${formatDateTime(date.toISOString())} (Triggered at ${formatDateTime(alertTime.toISOString())})`);
                } catch (err) {
                    logger.error(`Failed to send alert for ${date.toISOString()}: ${err.message}`);
                }
            });

            activeCronTasks.push(task);
        }
    });

    logger.info(`Successfully registered ${activeCronTasks.length} future alerts.`);
}

/**
 * Helper: Convert Date object to cron expression
 * Format: "minute hour day month dayOfWeek" (seconds optional in node-cron usually)
 * We'll use: "minute hour day month *"
 * 
 * IMPORTANT: We must ensure the cron expression matches the system timezone 
 * OR we pass the timezone to cron.schedule.
 * 
 * If we use `date.getMinutes()`, it returns local time minutes.
 * If we use `config.scheduler.timezone` in `cron.schedule`, we must provide 
 * the hours/minutes valid for THAT timezone.
 */
function getCronExpressionFromDate(date) {
    // We will use the target timezone to formatting the expression
    // and pass the timezone option to node-cron (if supported per task)
    // Actually, node-cron `schedule` options has `timezone`. 
    // So we should extract the components relative to that timezone.

    const tz = config.scheduler.timezone;
    const footer = { timeZone: tz, hour12: false };

    const minute = new Intl.DateTimeFormat('en-US', { ...footer, minute: 'numeric' }).format(date);
    const hour = new Intl.DateTimeFormat('en-US', { ...footer, hour: 'numeric' }).format(date);
    const day = new Intl.DateTimeFormat('en-US', { ...footer, day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-US', { ...footer, month: 'numeric' }).format(date);

    // "minute hour day month *"
    return `${minute} ${hour} ${day} ${month} *`;
}

/**
 * Build the alert message content
 */
function buildAlertMessage(date, name, level) {
    const timeStr = formatDateTime(date.toISOString());
    return `🔔 <b>${name}</b>\n\n` +
        `🕒 Thời gian: <b>${timeStr}</b>\n` +
        `⚠️ Mức độ: ${level}`;
}

module.exports = { registerMonthlySchedule, clearScheduledJobs };
