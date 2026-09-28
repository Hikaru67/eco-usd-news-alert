/**
 * Service: Send messages to Telegram via Bot API
 */
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { formatDateTime, getDateKey } = require('./timezone.service');

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function formatWeekdayDate(dateKey) {
    const date = new Date(`${dateKey}T00:00:00Z`);

    return new Intl.DateTimeFormat('vi-VN', {
        // dateKey is a local calendar date, so keep its weekday and date together.
        timeZone: 'UTC',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
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
 * Build and send one weekly summary of High-impact USD events.
 * Sends a useful empty-state message when there are no matching events.
 *
 * @param {Array} events - Filtered High-impact USD events
 * @param {string} weekStart - Monday in YYYY-MM-DD format (UTC+7)
 * @param {string} weekEnd - Sunday in YYYY-MM-DD format (UTC+7)
 */
async function sendWeeklyNewsSummary(events, weekStart, weekEnd) {
    const weekStartLabel = formatWeekdayDate(weekStart).replace(/^.*?,\s*/, '');
    const weekEndLabel = formatWeekdayDate(weekEnd).replace(/^.*?,\s*/, '');

    let message = `📅 <b>LỊCH TIN QUAN TRỌNG TUẦN</b>\n`;
    message += `<b>${weekStartLabel} → ${weekEndLabel}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (events.length === 0) {
        message += `✅ Tuần này không có tin kinh tế Mỹ quan trọng nào\n`;
        message += `(High-impact USD).\n\n`;
        message += `Thị trường có thể ít biến động bởi tin tức kinh tế theo lịch.`;
        await sendMessage(message, config.telegram.newsTopicId);
        return;
    }

    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let currentDateKey = null;

    sortedEvents.forEach((event) => {
        const dateKey = getDateKey(event.date);

        if (dateKey !== currentDateKey) {
            currentDateKey = dateKey;
            message += `🔴 <b>${escapeHtml(formatWeekdayDate(dateKey))}</b>\n`;
        }

        const timeStr = formatDateTime(event.date).split(' ')[1];
        message += `${timeStr}  <b>${escapeHtml(event.title)}</b>\n`;

        if (event.forecast) {
            message += `   📈 Forecast: ${escapeHtml(event.forecast)}\n`;
        }
        if (event.previous) {
            message += `   📉 Previous: ${escapeHtml(event.previous)}\n`;
        }

        message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚠️ <i>Các tin High-impact có thể gây biến động mạnh.</i>`;

    await sendMessage(message, config.telegram.newsTopicId);
}

/**
 * Send the scheduled BTC volatility timestamps for the current week.
 * @param {Array<Date>} schedule - Scheduled timestamps in chronological order
 * @param {string} weekStart - Monday in YYYY-MM-DD format (UTC+7)
 * @param {string} weekEnd - Sunday in YYYY-MM-DD format (UTC+7)
 */
async function sendWeeklyBtcSchedule(schedule, weekStart, weekEnd) {
    const timezone = config.scheduler.timezone;
    const weekStartLabel = formatWeekdayDate(weekStart).replace(/^.*?,\s*/, '');
    const weekEndLabel = formatWeekdayDate(weekEnd).replace(/^.*?,\s*/, '');

    let message = `📊 <b>LỊCH BIẾN ĐỘNG BTC TRONG TUẦN</b>\n`;
    message += `<b>${weekStartLabel} → ${weekEndLabel}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (schedule.length === 0) {
        message += `Không có mốc biến động BTC nào được lên lịch trong tuần này.`;
        await sendMessage(message, config.telegram.btcTopicId);
        return;
    }

    const scheduleByDate = new Map();
    schedule.forEach((date) => {
        const dateKey = getDateKey(date.toISOString(), timezone);
        if (!scheduleByDate.has(dateKey)) {
            scheduleByDate.set(dateKey, []);
        }
        scheduleByDate.get(dateKey).push(date);
    });

    const dayLines = [...scheduleByDate.entries()].map(([dateKey, dates]) => {
        const sortedDates = dates.sort((a, b) => a - b);
        const timeRanges = [];
        let rangeStart = sortedDates[0];
        let rangeEnd = sortedDates[0];

        const addRange = () => {
            const startTime = formatDateTime(rangeStart.toISOString(), timezone).split(' ')[1];
            const endTime = formatDateTime(rangeEnd.toISOString(), timezone).split(' ')[1];
            timeRanges.push(startTime === endTime ? startTime : `${startTime}–${endTime}`);
        };

        for (let index = 1; index < sortedDates.length; index += 1) {
            const date = sortedDates[index];
            if (date.getTime() - rangeEnd.getTime() === 60 * 60 * 1000) {
                rangeEnd = date;
                continue;
            }

            addRange();
            rangeStart = date;
            rangeEnd = date;
        }
        addRange();

        return `📍 ${formatWeekdayDate(dateKey)} · <b>${timeRanges.join(', ')}</b>`;
    });

    message += dayLines.join('\n\n');
    await sendMessage(message, config.telegram.btcTopicId);
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
    sendWeeklyNewsSummary,
    sendWeeklyBtcSchedule,
    sendSingleEventAlert,
    sendEventResultAlert,
};
