/**
 * Cron: Monthly Scheduler
 * 
 * Runs on the 1st of every month at 00:00.
 * Generates the schedule for the new month and registers cron jobs.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config/env');
const { generateMonthlySchedule } = require('../services/scheduleGenerator.service');
const { registerMonthlySchedule } = require('../services/monthlyCronRegistrar.service');

const fs = require('fs');
const path = require('path');

/**
 * Main function to generate and apply schedule for the current month
 */
function runMonthlyScheduler() {
    try {
        logger.info('Running Monthly Scheduler...');

        const { startTime, timezone } = config.scheduler;

        // 1. Generate dates for current month
        const schedule = generateMonthlySchedule({
            startTime,
            timezone,
            targetDate: new Date() // implicitly targets current month
        });

        logger.info(`Generated ${schedule.length} time slots for this month.`);

        // 2. Log schedule to file
        logScheduleToFile(schedule, timezone);

        // 3. Register cron jobs
        registerMonthlySchedule(schedule);

    } catch (error) {
        logger.error('Error in Monthly Scheduler:', error);
    }
}

/**
 * Log the generated schedule to a file in the logs directory
 * Filename format: monthly-schedule-YYYY-MM.log
 */
function logScheduleToFile(schedule, timezone) {
    if (!schedule || schedule.length === 0) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const filename = `monthly-schedule-${year}-${month}.log`;
    const filePath = path.join(logsDir, filename);

    let content = `Schedule for ${year}-${month}\n`;
    content += `Generated at: ${new Date().toISOString()}\n`;
    content += `Total slots: ${schedule.length}\n`;
    content += `Timezone: ${timezone}\n`;
    content += `--------------------------------------------------\n`;
    content += `   # | Date (ISO)               | Local Time\n`;
    content += `--------------------------------------------------\n`;

    schedule.forEach((date, index) => {
        const localTime = date.toLocaleString('en-GB', { timeZone: timezone });
        const num = String(index + 1).padStart(4, ' ');
        content += `${num} | ${date.toISOString()} | ${localTime}\n`;
    });

    try {
        fs.writeFileSync(filePath, content);
        logger.info(`Schedule log saved to: ${filePath}`);
    } catch (err) {
        logger.error(`Failed to write schedule log: ${err.message}`);
    }
}

/**
 * Start the monthly cron job (runs 1st of month at 00:00)
 */
function startMonthlyCron() {
    // "0 0 1 * *" -> At 00:00 on day-of-month 1
    const cronSchedule = '0 0 1 * *';
    const timezone = config.scheduler.timezone;

    logger.info(`Monthly scheduler initialized (${cronSchedule} in ${timezone})`);

    cron.schedule(cronSchedule, runMonthlyScheduler, {
        timezone
    });
}

module.exports = { startMonthlyCron, runMonthlyScheduler };
