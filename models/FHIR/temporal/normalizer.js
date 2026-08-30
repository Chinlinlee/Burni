const {
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN
} = require("./constants");
const { inferDatePrecision, inferDateTimePrecision, inferInstantPrecision } = require("./lexical");
const { expectedDateBoundaries } = require("./calendar");
const {
    parseDateTimeToUtcEpoch,
    expectedDateTimeBoundaries
} = require("./epoch");
const {
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant
} = require("./validate");

/**
 * @param {import('./types').CanonicalDate} canonical
 * @returns {import('./types').CanonicalDate}
 */
function assertValidCanonicalDate(canonical) {
    const validation = validateCanonicalDate(canonical);
    if (!validation.valid) {
        throw new Error(validation.errors.join("; "));
    }
    return canonical;
}

/**
 * @param {import('./types').CanonicalDateTime} canonical
 * @returns {import('./types').CanonicalDateTime}
 */
function assertValidCanonicalDateTime(canonical) {
    const validation = validateCanonicalDateTime(canonical);
    if (!validation.valid) {
        throw new Error(validation.errors.join("; "));
    }
    return canonical;
}

/**
 * @param {import('./types').CanonicalInstant} canonical
 * @returns {import('./types').CanonicalInstant}
 */
function assertValidCanonicalInstant(canonical) {
    const validation = validateCanonicalInstant(canonical);
    if (!validation.valid) {
        throw new Error(validation.errors.join("; "));
    }
    return canonical;
}

/**
 * @param {unknown} scalar
 * @returns {import('./types').CanonicalDate}
 */
function normalizeDate(scalar) {
    if (typeof scalar !== "string" || scalar.length === 0) {
        throw new Error("FHIR date must be a non-empty string");
    }

    if (!DATE_PATTERN.test(scalar)) {
        throw new Error(`Invalid FHIR date value: ${scalar}`);
    }

    const precision = inferDatePrecision(scalar);
    if (!precision) {
        throw new Error(`Unable to infer date precision for value: ${scalar}`);
    }

    const boundaries = expectedDateBoundaries(scalar, precision);
    if (!boundaries) {
        throw new Error(`Unable to derive date boundaries for value: ${scalar}`);
    }

    return assertValidCanonicalDate({
        value: scalar,
        precision,
        normalizedStart: boundaries.normalizedStart,
        normalizedEnd: boundaries.normalizedEnd
    });
}

/**
 * @param {unknown} scalar
 * @returns {import('./types').CanonicalDateTime}
 */
function normalizeDateTime(scalar) {
    if (typeof scalar !== "string" || scalar.length === 0) {
        throw new Error("FHIR dateTime must be a non-empty string");
    }

    if (!DATETIME_PATTERN.test(scalar)) {
        throw new Error(`Invalid FHIR dateTime value: ${scalar}`);
    }

    const inferred = inferDateTimePrecision(scalar);
    if (!inferred) {
        throw new Error(`Unable to infer dateTime precision for value: ${scalar}`);
    }

    const boundaries = expectedDateTimeBoundaries(
        scalar,
        inferred.precision,
        inferred.fractionDigits
    );

    /** @type {import('./types').CanonicalDateTime} */
    const canonical = {
        value: scalar,
        precision: inferred.precision,
        normalizedStart: boundaries.normalizedStart,
        normalizedEnd: boundaries.normalizedEnd
    };

    if (inferred.fractionDigits !== undefined) {
        canonical.fractionDigits = inferred.fractionDigits;
    }

    return assertValidCanonicalDateTime(canonical);
}

/**
 * @param {unknown} scalar
 * @returns {import('./types').CanonicalInstant}
 */
function normalizeInstant(scalar) {
    if (typeof scalar !== "string" || scalar.length === 0) {
        throw new Error("FHIR instant must be a non-empty string");
    }

    if (!INSTANT_PATTERN.test(scalar)) {
        throw new Error(`Invalid FHIR instant value: ${scalar}`);
    }

    if (!/(Z|[+-]\d{2}:\d{2})$/.test(scalar)) {
        throw new Error(`FHIR instant must include a timezone: ${scalar}`);
    }

    const inferred = inferInstantPrecision(scalar);
    if (!inferred) {
        throw new Error(`Unable to infer instant precision for value: ${scalar}`);
    }

    /** @type {import('./types').CanonicalInstant} */
    const canonical = {
        value: scalar,
        precision: inferred.precision,
        epochSeconds: parseDateTimeToUtcEpoch(scalar)
    };

    if (inferred.fractionDigits !== undefined) {
        canonical.fractionDigits = inferred.fractionDigits;
    }

    return assertValidCanonicalInstant(canonical);
}

/**
 * @param {unknown} scalar
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {import('./types').CanonicalDate | import('./types').CanonicalDateTime | import('./types').CanonicalInstant}
 */
function normalizeTemporal(scalar, type) {
    switch (type) {
        case "date":
            return normalizeDate(scalar);
        case "dateTime":
            return normalizeDateTime(scalar);
        case "instant":
            return normalizeInstant(scalar);
        default:
            throw new Error(`Unsupported temporal type: ${type}`);
    }
}

/**
 * Build a canonical instant from a UTC Date. Used for server-owned
 * lastUpdated, not public FHIR string writes.
 *
 * @param {Date} date
 * @returns {import('./types').CanonicalInstant}
 */
function canonicalInstantFromUtcDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error("canonicalInstantFromUtcDate requires a valid Date");
    }

    return normalizeInstant(date.toISOString());
}

module.exports = {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal,
    canonicalInstantFromUtcDate
};
