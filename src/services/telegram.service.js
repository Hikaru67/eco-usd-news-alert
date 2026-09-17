/**
 * Service: Send messages to Telegram via Bot API
 */
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { formatDateTime } = require('./timezone.service');

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

/**
 * Send a text message to the configured Telegram channel
 * @param {string} text - Message text (supports HTML parse mode)
 * @param {string} [topicId] - Optional: Topic ID (message_thread_id) to send to
 * @returns {Promise<object>} Telegram API response
 */
async function sendMessage(text, topicId = null) {
    const url = `${TELEGRAM_API_BASE}${config.telegram.botToken}/sendMessage`;

    try {
        const payload = {
            chat_id: config.telegram.groupId,
            text,
            parse_mode: 'HTML',
        };

        if (topicId) {
            payload.message_thread_id = topicId;
        }

        const response = await axios.post(url, payload);

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
        const timeStr = formatDateTime(event.date);

        message += `${timeStr} 🔴 <b>${event.title}</b>\n`;

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

    await sendMessage(message, config.telegram.newsTopicId);
}

/**
 * Build and send an alert for a single event (5 minutes before it happens)
 * @param {object} event - Single event object
 */
async function sendSingleEventAlert(event) {
    const timeStr = formatDateTime(event.date);

    let message = `⏰ <b>Tin sắp ra trong 5 phút!</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    message += `${timeStr} 🔴 <b>${event.title}</b>\n`;

    // Include forecast & previous if available
    if (event.forecast) {
        message += `📈 Forecast: ${event.forecast}\n`;
    }
    if (event.previous) {
        message += `📉 Previous: ${event.previous}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚠️ <i>Prepare for potential market volatility.</i>`;

    await sendMessage(message, config.telegram.newsTopicId);
}

/**
 * Send the published result for an economic event.
 * @param {object} event - Refreshed event containing the actual result
 */
async function sendEventResultAlert(event) {
    const timeStr = formatDateTime(event.date);

    let message = `✅ <b>Kết quả tin kinh tế</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `${timeStr} 🔴 <b>${escapeHtml(event.title)}</b>\n`;
    message += `🎯 Actual: <b>${escapeHtml(event.actual)}</b>\n`;

    if (event.forecast) {
        message += `📈 Forecast: ${escapeHtml(event.forecast)}\n`;
    }
    if (event.previous) {
        message += `📉 Previous: ${escapeHtml(event.previous)}\n`;
    }

    await sendMessage(message, config.telegram.newsTopicId);
}

module.exports = {
    sendMessage,
    sendNewsAlert,
    sendSingleEventAlert,
    sendEventResultAlert,
};
