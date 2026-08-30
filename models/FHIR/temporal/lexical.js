const {
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION
} = require("./constants");

/**
 * @param {string} value
 * @returns {import('./types').DatePrecision | null}
 */
function inferDatePrecision(value) {
    if (!DATE_PATTERN.test(value)) {
        return null;
    }

    if (/^\d{4}$/.test(value)) {
        return DATE_PRECISION.YEAR;
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
        return DATE_PRECISION.MONTH;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return DATE_PRECISION.DAY;
    }

    return null;
}

/**
 * @param {string} value
 * @returns {{ precision: import('./types').DateTimePrecision, fractionDigits?: number } | null}
 */
function inferDateTimePrecision(value) {
    if (!DATETIME_PATTERN.test(value)) {
        return null;
    }

    if (/^\d{4}$/.test(value)) {
        return { precision: DATETIME_PRECISION.YEAR };
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
        return { precision: DATETIME_PRECISION.MONTH };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { precision: DATETIME_PRECISION.DAY };
    }

    const fractionMatch = value.match(/T\d{2}:\d{2}:(\d{2}|60)\.(\d+)/);
    if (fractionMatch) {
        return {
            precision: DATETIME_PRECISION.FRACTION,
            fractionDigits: fractionMatch[2].length
        };
    }

    if (/T\d{2}:\d{2}:(\d{2}|60)(?:Z|[+-])/.test(value) || /T\d{2}:\d{2}:(\d{2}|60)$/.test(value)) {
        return { precision: DATETIME_PRECISION.SECOND };
    }

    if (/T\d{2}:\d{2}(?:Z|[+-])/.test(value) || /T\d{2}:\d{2}$/.test(value)) {
        return { precision: DATETIME_PRECISION.MINUTE };
    }

    return null;
}

/**
 * @param {string} value
 * @returns {{ precision: import('./types').InstantPrecision, fractionDigits?: number } | null}
 */
function inferInstantPrecision(value) {
    if (!INSTANT_PATTERN.test(value)) {
        return null;
    }

    const fractionMatch = value.match(/:(\d{2}|60)\.(\d+)/);
    if (fractionMatch) {
        return {
            precision: INSTANT_PRECISION.FRACTION,
            fractionDigits: fractionMatch[2].length
        };
    }

    return { precision: INSTANT_PRECISION.SECOND };
}

module.exports = {
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision
};
