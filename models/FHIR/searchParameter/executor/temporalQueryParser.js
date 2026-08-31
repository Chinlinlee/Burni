const {
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN
} = require("../../temporal/constants");
const {
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision
} = require("../../temporal/lexical");
const {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    normalizeDateTimeSafe
} = require("../../temporal/errors");
const { expectedDateBoundaries } = require("../../temporal/calendar");
const { parseInstantQueryValue } = require("./instantQueryBuilder");

const COMPARATOR_PREFIXES = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];
const TEMPORAL_KINDS = new Set(["date", "dateTime", "instant"]);
const INSTANT_WITHOUT_TIMEZONE_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

/**
 * @typedef {Object} TemporalQueryValue
 * @property {string} rawValue
 * @property {string} value
 * @property {'date' | 'dateTime' | 'instant'} kind
 * @property {string} precision
 * @property {number} [fractionDigits]
 * @property {string} [comparator]
 * @property {TemporalQueryRange} [range]
 * @property {string | import('mongoose').Types.Decimal128} [queryStart]
 * @property {string | import('mongoose').Types.Decimal128} [queryEnd]
 * @property {import('mongoose').Types.Decimal128} [epochSeconds]
 */

/**
 * @typedef {Object} DateQueryRange
 * @property {'date'} kind
 * @property {string} start
 * @property {string} end
 */

/**
 * @typedef {Object} DateTimeQueryRange
 * @property {'dateTime'} kind
 * @property {import('mongoose').Types.Decimal128} start
 * @property {import('mongoose').Types.Decimal128} end
 */

/**
 * @typedef {DateQueryRange | DateTimeQueryRange} TemporalQueryRange
 */

/**
 * @param {string} rawValue
 * @returns {{ value: string, comparator: string | undefined }}
 */
function splitComparatorPrefix(rawValue) {
    for (const comparator of COMPARATOR_PREFIXES) {
        if (rawValue.startsWith(comparator) && rawValue.length > comparator.length) {
            return {
                comparator,
                value: rawValue.slice(comparator.length)
            };
        }
    }

    return { value: rawValue, comparator: undefined };
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {string}
 */
function validateCalendarDate(value, kind) {
    const dateValue = value.split("T", 1)[0];
    if (dateValue.length !== 10) {
        return value;
    }

    const year = Number(dateValue.slice(0, 4));
    const month = Number(dateValue.slice(5, 7));
    const day = Number(dateValue.slice(8, 10));
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [
        31,
        leapYear ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ];
    if (day > daysInMonth[month - 1]) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Invalid FHIR ${kind} calendar date: ${dateValue}`
        );
    }
    return value;
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {{ precision: string, fractionDigits?: number }}
 */
function parseTemporalLexicalValue(value, kind) {
    if (kind === "instant" && INSTANT_WITHOUT_TIMEZONE_PATTERN.test(value)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE,
            `FHIR instant must include a timezone: ${value}`
        );
    }

    const pattern =
        kind === "date"
            ? DATE_PATTERN
            : kind === "dateTime"
              ? DATETIME_PATTERN
              : INSTANT_PATTERN;
    if (!pattern.test(value)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Invalid FHIR ${kind} query value: ${value}`
        );
    }

    validateCalendarDate(value, kind);
    const inferred =
        kind === "date"
            ? inferDatePrecision(value)
            : kind === "dateTime"
              ? inferDateTimePrecision(value)
              : inferInstantPrecision(value);
    if (!inferred) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
            `Unable to infer ${kind} query precision for value: ${value}`
        );
    }
    return typeof inferred === "string"
        ? { precision: inferred }
        : {
              precision: inferred.precision,
              fractionDigits: inferred.fractionDigits
          };
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime'} kind
 * @returns {TemporalQueryRange}
 */
function normalizeTemporalQueryRange(value, kind) {
    if (kind === "date") {
        const inferred = parseTemporalLexicalValue(value, kind);
        const boundaries = expectedDateBoundaries(value, inferred.precision);
        if (!boundaries) {
            throw new TemporalValidationError(
                TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
                `Unable to derive date query boundaries for value: ${value}`
            );
        }
        return {
            kind,
            start: boundaries.normalizedStart,
            end: boundaries.normalizedEnd
        };
    }

    if (kind === "dateTime") {
        const canonical = normalizeDateTimeSafe(value);
        return {
            kind,
            start: canonical.normalizedStart,
            end: canonical.normalizedEnd
        };
    }

    throw new TemporalValidationError(
        TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
        `Temporal query range is not supported for kind: ${kind}`
    );
}

/**
 * @param {unknown} rawValue
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {TemporalQueryValue}
 */
function parseTemporalQueryValue(rawValue, kind) {
    if (!TEMPORAL_KINDS.has(kind)) {
        throw new Error(`Unsupported temporal query kind: ${kind}`);
    }
    if (typeof rawValue !== "string" || rawValue.length === 0) {
        throw new Error(`FHIR ${kind} query value must be a non-empty string`);
    }

    const split = splitComparatorPrefix(rawValue);
    if (kind === "instant") {
        return parseInstantQueryValue(rawValue);
    }
    assertPublicTemporalScalar(split.value, kind);
    const inferred = parseTemporalLexicalValue(split.value, kind);
    const parsed = {
        rawValue,
        value: split.value,
        kind,
        precision: inferred.precision
    };

    if (kind === "date" || kind === "dateTime") {
        parsed.range = normalizeTemporalQueryRange(split.value, kind);
        parsed.queryStart = parsed.range.start;
        parsed.queryEnd = parsed.range.end;
    }

    if (split.comparator !== undefined) {
        parsed.comparator = split.comparator;
    }
    if (inferred.fractionDigits !== undefined) {
        parsed.fractionDigits = inferred.fractionDigits;
    }

    return parsed;
}

module.exports = {
    COMPARATOR_PREFIXES,
    TEMPORAL_KINDS,
    splitComparatorPrefix,
    normalizeTemporalQueryRange,
    parseTemporalQueryValue
};
