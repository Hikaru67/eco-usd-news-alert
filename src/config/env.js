/**
 * Environment configuration
 * Load and validate all required environment variables
 */
require('dotenv').config();

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    groupId: process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_CHANNEL_ID,
    newsTopicId: process.env.TELEGRAM_NEWS_TOPIC_ID,
    btcTopicId: process.env.TELEGRAM_BTC_TOPIC_ID,
  },
  api: {
    calendarUrl: process.env.FAIR_ECONOMY_CALENDAR_URL,
  },
  timezone: {
    // Offset from UTC in hours (e.g., 7 for UTC+7)
    offset: parseInt(process.env.TIMEZONE_OFFSET, 10) || 7,
  },
  scheduler: {
    startTime: process.env.SCHEDULER_START_TIME || '2026-02-09T17:00:00',
    timezone: process.env.SCHEDULER_TIMEZONE || 'Asia/Ho_Chi_Minh',
    name: process.env.SCHEDULER_NAME || 'BTC biến động',
    level: process.env.SCHEDULER_LEVEL || '🟠 Trung bình',
  },
};

// Validate required environment variables
const requiredVars = [
  { key: 'TELEGRAM_BOT_TOKEN', value: config.telegram.botToken },
  // Require either Group ID or Channel ID associated with 'groupId' key
  { key: 'TELEGRAM_GROUP_ID (or CHANNEL_ID)', value: config.telegram.groupId },
  { key: 'FAIR_ECONOMY_CALENDAR_URL', value: config.api.calendarUrl },
  { key: 'SCHEDULER_START_TIME', value: config.scheduler.startTime },
];

for (const { key, value } of requiredVars) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
