const mongoose = require("mongoose");
const { addCalendarDays } = require("./calendar");
const { addDecimal, divideDecimalByTen } = require("./arithmetic");

const APPROXIMATION_RATIO = 0.1;
const CALENDAR_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {string} value
 * @returns {number}
 */
function calendarDateToMilliseconds(value) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
}

/**
 * @param {string} value
 * @param {number} days
 * @returns {string}
 */
function shiftCalendarDate(value, days) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    return addCalendarDays(year, month, day, days);
}

/**
 * @param {{ start: string, end: string }}
 * @returns {{ kind: 'date', start: string, end: string }}
 */
function approximateCalendarRange(range) {
    const durationDays = Math.round(
        (calendarDateToMilliseconds(range.end) - calendarDateToMilliseconds(range.start)) /
            CALENDAR_DAY_MS
    );
    const days = Math.max(1, Math.ceil(durationDays * APPROXIMATION_RATIO));
    return {
        kind: "date",
        start: shiftCalendarDate(range.start, -days),
        end: shiftCalendarDate(range.end, days)
    };
}

/**
 * @param {{ start: import('mongoose').Types.Decimal128, end: import('mongoose').Types.Decimal128 }}
 * @returns {{ start: import('mongoose').Types.Decimal128, end: import('mongoose').Types.Decimal128 }}
 */
function approximateDecimalRange(range) {
    const width = addDecimal(range.end.toString(), range.start.toString(), -1);
    const delta = divideDecimalByTen(width);
    return {
        start: mongoose.Types.Decimal128.fromString(
            addDecimal(range.start.toString(), delta, -1)
        ),
        end: mongoose.Types.Decimal128.fromString(addDecimal(range.end.toString(), delta, 1))
    };
}

module.exports = {
    APPROXIMATION_RATIO,
    approximateCalendarRange,
    approximateDecimalRange
};
