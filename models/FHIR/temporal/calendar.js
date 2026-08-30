const { CALENDAR_DATE_PATTERN } = require("./constants");
const { DATE_PRECISION } = require("./constants");

/**
 * @param {string} value
 * @returns {boolean}
 */
function isCalendarDate(value) {
    if (!CALENDAR_DATE_PATTERN.test(value)) {
        return false;
    }

    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));

    if (month < 1 || month > 12 || day < 1) {
        return false;
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day <= daysInMonth;
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function compareCalendarDates(left, right) {
    return left.localeCompare(right);
}

/**
 * @param {number} year
 * @param {number} month
 * @param {number} dayOffset
 * @returns {string}
 */
function addCalendarDays(year, month, day, dayOffset) {
    const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * @param {string} value
 * @param {import('./types').DatePrecision} precision
 * @returns {{ normalizedStart: string, normalizedEnd: string } | null}
 */
function expectedDateBoundaries(value, precision) {
    if (precision === DATE_PRECISION.YEAR) {
        const year = Number(value);
        if (!Number.isInteger(year)) {
            return null;
        }
        return {
            normalizedStart: `${value}-01-01`,
            normalizedEnd: `${year + 1}-01-01`
        };
    }

    if (precision === DATE_PRECISION.MONTH) {
        const [yearText, monthText] = value.split("-");
        const year = Number(yearText);
        const month = Number(monthText);
        const nextMonthDate = new Date(Date.UTC(year, month, 1));
        const endYear = nextMonthDate.getUTCFullYear();
        const endMonth = String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0");
        return {
            normalizedStart: `${yearText}-${monthText}-01`,
            normalizedEnd: `${endYear}-${endMonth}-01`
        };
    }

    if (precision === DATE_PRECISION.DAY) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(5, 7));
        const day = Number(value.slice(8, 10));
        return {
            normalizedStart: value,
            normalizedEnd: addCalendarDays(year, month, day, 1)
        };
    }

    return null;
}

module.exports = {
    isCalendarDate,
    compareCalendarDates,
    expectedDateBoundaries
};
