/**
 * News Alert System - Entry Point
 *
 * Flow:
 * 1. On startup, immediately fetch & schedule alerts (so we don't wait until Monday)
 * 2. Start the weekly cron to repeat every Monday at 05:00 AM (UTC+7)
 *
 * Weekly Cron (Monday 05:00 UTC+7):
 *   → Fetch JSON from Fair Economy API
 *   → Filter: impact === "High" && country === "USD"
 *   → Convert times from UTC-5 to UTC+7 (+12 hours)
 *   → Group events by date (UTC+7)
 *   → Schedule a daily alert cron for each date at 07:00 AM (UTC+7)
 *
 * Daily Alert Cron (07:00 UTC+7 on news days):
 *   → Send formatted Telegram message with the day's High-impact USD events
 */
const logger = require('./utils/logger');
const { startWeeklyCron, fetchAndScheduleAlerts } = require('./cron/weeklyFetch.cron');
const { startMonthlyCron, runMonthlyScheduler } = require('./cron/monthlyScheduler.cron');

async function main() {
    logger.info('🚀 News Alert System starting...');
    logger.info(`   Timezone target: UTC+${process.env.TIMEZONE_OFFSET || 7}`);
    logger.info(`   API: ${process.env.FAIR_ECONOMY_CALENDAR_URL}`);

    // Start the weekly cron (every Monday 05:00 UTC+7)
    startWeeklyCron();

    // Start the monthly scheduler (1st of month)
    startMonthlyCron();

    // Also run immediately on startup to catch this week's events
    logger.info('Running initial fetch & schedule...');
    await fetchAndScheduleAlerts();

    // Run monthly scheduler immediately to register this month's custom alerts
    logger.info('Initializing custom alert schedule...');
    runMonthlyScheduler();

    logger.info('✅ News Alert System is running. Press Ctrl+C to stop.');
}

main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
});
