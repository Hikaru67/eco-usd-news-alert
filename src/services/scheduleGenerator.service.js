/**
 * Service: Generate schedule timestamps based on a fixed pattern
 *
 * Pattern: +8h -> +8h -> +4h (Loop)
 * Clone rule: Each main timestamp creates a clone at +1h
 */

// We will use vanilla JS with Intl for timezone handling

/**
 * Check if a date is within the target month/year in the given timezone
 * @param {Date} date - Date object to check
 * @param {number} month - 0-based month index (0-11)
 * @param {number} year - Full year (e.g. 2026)
 * @param {string} timezone - Timezone string
 * @returns {boolean}
 */
function isDateInMonth(date, month, year, timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const dateYear = parseInt(parts.find(p => p.type === 'year').value);
    const dateMonth = parseInt(parts.find(p => p.type === 'month').value) - 1; // Intl returns 1-12

    return dateYear === year && dateMonth === month;
}

/**
 * Generate schedule for a specific month
 * @param {object} config
 * @param {string} config.startTime - ISO 8601 start time
 * @param {string} config.timezone - Target timezone
 * @param {Date} [config.targetDate] - Date within the target month (defaults to now)
 * @returns {Array<Date>} List of Date objects sorted chronologically
 */
function generateMonthlySchedule({ startTime, timezone, targetDate = new Date() }) {
    const start = new Date(startTime);

    // Determine target month and year in the target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
    });

    const targetParts = targetFormatter.formatToParts(targetDate);
    const targetYear = parseInt(targetParts.find(p => p.type === 'year').value);
    const targetMonth = parseInt(targetParts.find(p => p.type === 'month').value) - 1;

    // Pattern intervals in hours
    const pattern = [8, 8, 4];
    let patternIndex = 0;

    let currentDate = new Date(start.getTime());
    const schedule = [];

    // Limit loop to prevent infinite loop in case of errors (e.g. 5 years ahead)
    const MAX_CYCLES = 10000;
    let cycles = 0;

    // We loop until we are PAST the target month
    // Optimization: If startTime is far behind, we could mathematically jump, 
    // but for simplicity and correctness with DST/timezone, looping is safer if within reasonable range.

    while (cycles < MAX_CYCLES) {
        // Check if current date is AFTER the target month
        // We can check if year > targetYear or (year == targetYear and month > targetMonth)
        const currentFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
        });
        const currentParts = currentFormatter.formatToParts(currentDate);
        const currentYear = parseInt(currentParts.find(p => p.type === 'year').value);
        const currentMonth = parseInt(currentParts.find(p => p.type === 'month').value) - 1;

        if (currentYear > targetYear || (currentYear === targetYear && currentMonth > targetMonth)) {
            break;
        }

        // If explicitly in the target month, add to schedule
        if (currentYear === targetYear && currentMonth === targetMonth) {
            // Add main node
            schedule.push(new Date(currentDate.getTime()));

            // Add clone node (+1 hour)
            const cloneDate = new Date(currentDate.getTime() + 60 * 60 * 1000);

            // Verify if clone is still in the same month (edge case: main is 23:30 on last day)
            if (isDateInMonth(cloneDate, targetMonth, targetYear, timezone)) {
                schedule.push(cloneDate);
            }
        }

        // Move to next step in pattern
        const hoursToAdd = pattern[patternIndex];
        currentDate = new Date(currentDate.getTime() + hoursToAdd * 60 * 60 * 1000);

        patternIndex = (patternIndex + 1) % pattern.length;
        cycles++;
    }

    return schedule.sort((a, b) => a - b);
}

module.exports = { generateMonthlySchedule };
