/**
 * Sends the BTC schedule for the current Monday-to-Sunday week every Monday
 * at 00:01 in the configured scheduler timezone.
 */
const cron = require('node-cron');
const config = require('../config/env');
const logger = require('../utils/logger');
const { generateMonthlySchedule } = require('../services/scheduleGenerator.service');
const { getDateKey, getWeekRange } = require('../services/timezone.service');
const { sendWeeklyBtcSchedule } = require('../services/telegram.service');

function getScheduleForWeek(referenceDate = new Date()) {
    const timezone = config.scheduler.timezone;
    const { start, end } = getWeekRange(referenceDate, timezone);
    const targetDates = [start, end].map((dateKey) => new Date(`${dateKey}T12:00:00Z`));
    const monthSchedules = targetDates.map((targetDate) =>
        generateMonthlySchedule({
            startTime: config.scheduler.startTime,
            timezone: config.scheduler.timezone,
            targetDate,
        })
    );
    const weekStart = start;
    const weekEnd = end;
    const scheduleByTimestamp = new Map();

    monthSchedules.flat().forEach((date) => {
        const dateKey = getDateKey(date.toISOString(), timezone);
        if (dateKey >= weekStart && dateKey <= weekEnd) {
            scheduleByTimestamp.set(date.getTime(), date);
        }
    });

    return {
        start,
        end,
        schedule: [...scheduleByTimestamp.values()].sort((a, b) => a - b),
    };
}

async function sendCurrentWeekSchedule() {
    const { start, end, schedule } = getScheduleForWeek();
    await sendWeeklyBtcSchedule(schedule, start, end);
    logger.info(`Weekly BTC schedule sent for ${start} → ${end} (${schedule.length} timestamps)`);
}

function startWeeklyBtcScheduleCron() {
    const cronExpression = '1 0 * * 1';
    const timezone = config.scheduler.timezone;

    logger.info(`Weekly BTC schedule cron scheduled: ${cronExpression} (${timezone})`);
    cron.schedule(cronExpression, () => {
        sendCurrentWeekSchedule().catch((error) => {
            logger.error('Failed to send weekly BTC schedule:', error.message);
        });
    }, { timezone });
}

module.exports = { startWeeklyBtcScheduleCron, getScheduleForWeek, sendCurrentWeekSchedule };
