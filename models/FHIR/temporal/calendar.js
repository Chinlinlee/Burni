const { CALENDAR_DATE_PATTERN } = require("./constants");
const { DATE_PRECISION } = require("./constants");

function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
    if (month === 2) {
        return isLeapYear(year) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function createUtcDate(year, monthIndex, day) {
    const date = new Date(0);
    date.setUTCFullYear(year, monthIndex, day);
    return date;
}

function formatCalendarYear(year) {
    if (!Number.isInteger(year) || year < 1 || year > 9999) {
        throw new RangeError("Calendar year must remain within the four-digit FHIR year range");
    }
    return String(year).padStart(4, "0");
}

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

    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
        return false;
    }

    return day <= daysInMonth(year, month);
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
    if (year === 9999 && month === 12 && day + dayOffset > 31) {
        return "9999-12-31";
    }
    const date = createUtcDate(year, month - 1, day + dayOffset);
    const y = date.getUTCFullYear();
    if (y > 9999) {
        return "9999-12-31";
    }
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${formatCalendarYear(y)}-${m}-${d}`;
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
            normalizedEnd:
                year === 9999 ? "9999-12-31" : `${formatCalendarYear(year + 1)}-01-01`
        };
    }

    if (precision === DATE_PRECISION.MONTH) {
        const [yearText, monthText] = value.split("-");
        const year = Number(yearText);
        const month = Number(monthText);
        if (year === 9999 && month === 12) {
            return {
                normalizedStart: `${yearText}-${monthText}-01`,
                normalizedEnd: "9999-12-31"
            };
        }
        const nextMonthDate = createUtcDate(year, month, 1);
        const endYear = nextMonthDate.getUTCFullYear();
        const endMonth = String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0");
        return {
            normalizedStart: `${yearText}-${monthText}-01`,
            normalizedEnd: `${formatCalendarYear(endYear)}-${endMonth}-01`
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
    expectedDateBoundaries,
    addCalendarDays
};
