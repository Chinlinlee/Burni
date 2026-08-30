const mongoose = require("mongoose");
const { DATE_PRECISION, DATETIME_PRECISION } = require("./constants");
const { expectedDateBoundaries } = require("./calendar");

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
    const leftFractionPadded = leftFraction.padEnd(maxFractionLength, "0");
    const rightFractionPadded = rightFraction.padEnd(maxFractionLength, "0");

    let fractionSum = BigInt(leftFractionPadded || "0") + BigInt(rightFractionPadded || "0");
    let carry = 0n;

    if (maxFractionLength > 0) {
        const fractionMod = 10n ** BigInt(maxFractionLength);
        if (fractionSum >= fractionMod) {
            carry = 1n;
            fractionSum -= fractionMod;
        }
    }

    const integerSum = BigInt(leftInteger) + BigInt(rightInteger) + carry;
    if (maxFractionLength === 0) {
        return integerSum.toString();
    }

    const fractionText = fractionSum.toString().padStart(maxFractionLength, "0").replace(/0+$/, "");
    return fractionText ? `${integerSum}.${fractionText}` : integerSum.toString();
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
    const year = Number(calendarDate.slice(0, 4));
    const month = Number(calendarDate.slice(5, 7));
    const day = Number(calendarDate.slice(8, 10));
    const epochSeconds = Date.UTC(year, month - 1, day) / 1000;
    return toDecimal128(String(epochSeconds));
}

/**
 * @param {string} value
 * @returns {import('mongoose').Types.Decimal128}
 */
function parseDateTimeToUtcEpoch(value) {
    const { year, month, day, hour, minute, second, fraction, offsetSeconds } =
        parseDateTimeComponents(value);
    const utcMilliseconds =
        Date.UTC(year, month - 1, day, hour, minute, second) - offsetSeconds * 1000;
    const integerEpoch = Math.trunc(utcMilliseconds / 1000);

    if (fraction) {
        return toDecimal128(`${integerEpoch}.${fraction}`);
    }

    return toDecimal128(String(integerEpoch));
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
    expectedDateTimeBoundaries
};
