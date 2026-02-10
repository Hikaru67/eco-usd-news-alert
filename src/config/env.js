/**
 * Environment configuration
 * Load and validate all required environment variables
 */
require('dotenv').config();

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    channelId: process.env.TELEGRAM_CHANNEL_ID,
  },
  api: {
    calendarUrl: process.env.FAIR_ECONOMY_CALENDAR_URL,
  },
  timezone: {
    // Offset from UTC in hours (e.g., 7 for UTC+7)
    offset: parseInt(process.env.TIMEZONE_OFFSET, 10) || 7,
  },
};

// Validate required environment variables
const requiredVars = [
  { key: 'TELEGRAM_BOT_TOKEN', value: config.telegram.botToken },
  { key: 'TELEGRAM_CHANNEL_ID', value: config.telegram.channelId },
  { key: 'FAIR_ECONOMY_CALENDAR_URL', value: config.api.calendarUrl },
];

for (const { key, value } of requiredVars) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
