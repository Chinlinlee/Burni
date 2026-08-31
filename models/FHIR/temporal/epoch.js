const mongoose = require("mongoose");
const { DATE_PRECISION, DATETIME_PRECISION } = require("./constants");
const { expectedDateBoundaries, isCalendarDate } = require("./calendar");

/**
 * @param {string} value
 * @returns {import('mongoose').Types.Decimal128}
 */
function toDecimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

/**
 * @param {string} value
 * @returns {number}
 */
function parseTimezoneOffsetSeconds(value) {
    if (value.endsWith("Z")) {
        return 0;
    }

    const match = value.match(/([+-])(\d{2}):(\d{2})$/);
    if (!match) {
        return 0;
    }

    const sign = match[1] === "+" ? 1 : -1;
    return sign * (Number(match[2]) * 3600 + Number(match[3]) * 60);
}

/**
 * @param {string} value
 * @returns {{
 *   year: number,
 *   month: number,
 *   day: number,
 *   hour: number,
 *   minute: number,
 *   second: number,
 *   fraction?: string,
 *   offsetSeconds: number
 * }}
 */
function parseDateTimeComponents(value) {
    const year = Number(value.slice(0, 4));
    let month = 1;
    let day = 1;
    let hour = 0;
    let minute = 0;
    let second = 0;
    let fraction;

    if (value.length >= 7) {
        month = Number(value.slice(5, 7));
    }

    if (value.length >= 10) {
        day = Number(value.slice(8, 10));
    }

    const calendarDate = `${String(year).padStart(4, "0")}-${String(month).padStart(
        2,
        "0"
    )}-${String(day).padStart(2, "0")}`;
    if (!isCalendarDate(calendarDate)) {
        throw new Error(`Invalid FHIR dateTime calendar date: ${calendarDate}`);
    }

    const timeIndex = value.indexOf("T");
    if (timeIndex !== -1) {
        const timePart = value.slice(timeIndex + 1);
        const timeMatch = timePart.match(
            /^(\d{2}):(\d{2})(?::(\d{2}|60)(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?$/
        );

        if (!timeMatch) {
            throw new Error(`Invalid FHIR dateTime time component: ${value}`);
        }

        hour = Number(timeMatch[1]);
        minute = Number(timeMatch[2]);
        second = timeMatch[3] ? Number(timeMatch[3]) : 0;
        fraction = timeMatch[4];
    }

    return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        fraction,
        offsetSeconds: parseTimezoneOffsetSeconds(value)
    };
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
function decimalAdd(left, right) {
    const [leftInteger, leftFraction = ""] = left.split(".");
    const [rightInteger, rightFraction = ""] = right.split(".");
    const maxFractionLength = Math.max(leftFraction.length, rightFraction.length);
    const scale = 10n ** BigInt(maxFractionLength);
    const toCoefficient = (integer, fraction) => {
        const negative = integer.startsWith("-");
        const absoluteInteger = negative ? integer.slice(1) : integer;
        const coefficient =
            BigInt(absoluteInteger || "0") * scale +
            BigInt(fraction.padEnd(maxFractionLength, "0") || "0");
        return negative ? -coefficient : coefficient;
    };
    const leftCoefficient = toCoefficient(leftInteger, leftFraction);
    const rightCoefficient = toCoefficient(rightInteger, rightFraction);
    const sum = leftCoefficient + rightCoefficient;

    if (sum === 0n) {
        return "0";
    }
    if (maxFractionLength === 0) {
        return sum.toString();
    }

    const sign = sum < 0n ? "-" : "";
    const absolute = sum < 0n ? -sum : sum;
    const integerPart = absolute / scale;
    const fractionText = (absolute % scale)
        .toString()
        .padStart(maxFractionLength, "0")
        .replace(/0+$/, "");
    return fractionText
        ? `${sign}${integerPart}.${fractionText}`
        : `${sign}${integerPart}`;
}

/**
 * @param {import('mongoose').Types.Decimal128} value
 * @param {number} seconds
 * @returns {import('mongoose').Types.Decimal128}
 */
function addSecondsToDecimal128(value, seconds) {
    return toDecimal128(decimalAdd(value.toString(), String(seconds)));
}

/**
 * @param {import('mongoose').Types.Decimal128} value
 * @param {number} fractionDigits
 * @returns {import('mongoose').Types.Decimal128}
 */
function addFractionStepToDecimal128(value, fractionDigits) {
    const step = fractionDigits > 0 ? `0.${"0".repeat(fractionDigits - 1)}1` : "1";
    return toDecimal128(decimalAdd(value.toString(), step));
}

/**
 * @param {string} calendarDate
 * @returns {import('mongoose').Types.Decimal128}
 */
function calendarDateToUtcEpoch(calendarDate) {
    const [yearText, monthText, dayText] = calendarDate.split("-");
    const date = new Date(0);
    date.setUTCFullYear(Number(yearText), Number(monthText) - 1, Number(dayText));
    date.setUTCHours(0, 0, 0, 0);
    const epochSeconds = date.getTime() / 1000;
    return toDecimal128(String(epochSeconds));
}

function dateTimeComponentsToUtcMilliseconds({ year, month, day, hour, minute, second }) {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, 0);
    return date.getTime();
}

function epochSecondsWithFraction(integerEpoch, fraction) {
    if (!fraction) {
        return String(integerEpoch);
    }
    if (integerEpoch >= 0) {
        return `${integerEpoch}.${fraction}`;
    }

    const scale = 10n ** BigInt(fraction.length);
    const absolute = BigInt(-integerEpoch) * scale - BigInt(fraction);
    if (absolute === 0n) {
        return "0";
    }
    const integerPart = absolute / scale;
    const fractionText = (absolute % scale)
        .toString()
        .padStart(fraction.length, "0")
        .replace(/0+$/, "");
    return fractionText
        ? `-${integerPart}.${fractionText}`
        : `-${integerPart}`;
}

/**
 * @param {string} value
 * @returns {import('mongoose').Types.Decimal128}
 */
function parseDateTimeToUtcEpoch(value) {
    const { year, month, day, hour, minute, second, fraction, offsetSeconds } =
        parseDateTimeComponents(value);
    const utcMilliseconds =
        dateTimeComponentsToUtcMilliseconds({
            year,
            month,
            day,
            hour,
            minute,
            second
        }) -
        offsetSeconds * 1000;
    const integerEpoch = Math.floor(utcMilliseconds / 1000);

    return toDecimal128(epochSecondsWithFraction(integerEpoch, fraction));
}

/**
 * @param {string} value
 * @param {import('./types').DateTimePrecision} precision
 * @param {number} [fractionDigits]
 * @returns {{ normalizedStart: import('mongoose').Types.Decimal128, normalizedEnd: import('mongoose').Types.Decimal128 }}
 */
function expectedDateTimeBoundaries(value, precision, fractionDigits) {
    if (
        precision === DATETIME_PRECISION.YEAR ||
        precision === DATETIME_PRECISION.MONTH ||
        precision === DATETIME_PRECISION.DAY
    ) {
        const datePrecision =
            precision === DATETIME_PRECISION.YEAR
                ? DATE_PRECISION.YEAR
                : precision === DATETIME_PRECISION.MONTH
                  ? DATE_PRECISION.MONTH
                  : DATE_PRECISION.DAY;
        const boundaries = expectedDateBoundaries(value, datePrecision);
        if (!boundaries) {
            throw new Error(`Unable to derive dateTime calendar boundaries for value: ${value}`);
        }

        return {
            normalizedStart: calendarDateToUtcEpoch(boundaries.normalizedStart),
            normalizedEnd: calendarDateToUtcEpoch(boundaries.normalizedEnd)
        };
    }

    const normalizedStart = parseDateTimeToUtcEpoch(value);

    if (precision === DATETIME_PRECISION.MINUTE) {
        return {
            normalizedStart,
            normalizedEnd: addSecondsToDecimal128(normalizedStart, 60)
        };
    }

    if (precision === DATETIME_PRECISION.SECOND) {
        return {
            normalizedStart,
            normalizedEnd: addSecondsToDecimal128(normalizedStart, 1)
        };
    }

    if (precision === DATETIME_PRECISION.FRACTION) {
        if (!Number.isInteger(fractionDigits) || fractionDigits <= 0) {
            throw new Error(`Invalid fractionDigits for dateTime value: ${value}`);
        }

        return {
            normalizedStart,
            normalizedEnd: addFractionStepToDecimal128(normalizedStart, fractionDigits)
        };
    }

    throw new Error(`Unsupported dateTime precision: ${precision}`);
}

module.exports = {
    parseDateTimeToUtcEpoch,
    expectedDateTimeBoundaries,
    calendarDateToUtcEpoch
};
