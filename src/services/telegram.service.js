/**
 * Service: Send messages to Telegram via Bot API
 */
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { convertToTargetTimezone, formatDateTime } = require('./timezone.service');

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a text message to the configured Telegram channel
 * @param {string} text - Message text (supports HTML parse mode)
 * @returns {Promise<object>} Telegram API response
 */
async function sendMessage(text) {
    const url = `${TELEGRAM_API_BASE}${config.telegram.botToken}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: config.telegram.channelId,
            text,
            parse_mode: 'HTML',
        });

        logger.info('Telegram message sent successfully');
        return response.data;
    } catch (error) {
        logger.error('Failed to send Telegram message:', error.message);
        throw error;
    }
}

/**
 * Build and send an alert message with a list of economic news events
 * @param {Array} events - Filtered events (High + USD)
 * @param {string} dateLabel - The date label for the alert (e.g., "11/02/2026")
 */
async function sendNewsAlert(events, dateLabel) {
    // Build the message content
    let message = `📊 <b>Economic News Alert - ${dateLabel}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    events.forEach((event, index) => {
        const convertedDate = convertToTargetTimezone(event.date);
        const timeStr = formatDateTime(convertedDate);

        message += `${index + 1}. <b>${event.title}</b>\n`;
        message += `   🕐 Time: ${timeStr} (UTC+${config.timezone.offset})\n`;
        message += `   🔴 Impact: ${event.impact}\n`;
        message += `   🌍 Country: ${event.country}\n`;

        // Include forecast & previous if available
        if (event.forecast) {
            message += `   📈 Forecast: ${event.forecast}\n`;
        }
        if (event.previous) {
            message += `   📉 Previous: ${event.previous}\n`;
        }

        message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚠️ <i>High-impact news may cause significant market volatility.</i>`;

    await sendMessage(message);
}

module.exports = { sendMessage, sendNewsAlert };
