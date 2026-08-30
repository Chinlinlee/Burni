const {
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES,
    CANONICAL_DATE_FIELDS,
    CANONICAL_DATETIME_FIELDS,
    CANONICAL_INSTANT_FIELDS
} = require("./constants");
const { isDecimal128 } = require("./decimal128");

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {Record<string, unknown>} value
 * @param {Set<string>} allowedFields
 * @returns {boolean}
 */
function hasOnlyAllowedFields(value, allowedFields) {
    return Object.keys(value).every((field) => allowedFields.has(field));
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {boolean}
 */
function isCanonicalTemporalObject(value, type) {
    if (!isPlainObject(value) || !hasOnlyAllowedFields(value, getCanonicalFields(type))) {
        return false;
    }

    if (typeof value.value !== "string" || value.value.length === 0) {
        return false;
    }

    switch (type) {
        case "date":
            return (
                DATE_PRECISION_VALUES.has(value.precision) &&
                typeof value.normalizedStart === "string" &&
                typeof value.normalizedEnd === "string"
            );
        case "dateTime":
            return (
                DATETIME_PRECISION_VALUES.has(value.precision) &&
                isDecimal128(value.normalizedStart) &&
                isDecimal128(value.normalizedEnd) &&
                (value.fractionDigits === undefined ||
                    (Number.isInteger(value.fractionDigits) && value.fractionDigits > 0))
            );
        case "instant":
            return (
                INSTANT_PRECISION_VALUES.has(value.precision) &&
                isDecimal128(value.epochSeconds) &&
                (value.fractionDigits === undefined ||
                    (Number.isInteger(value.fractionDigits) && value.fractionDigits > 0))
            );
        default:
            return false;
    }
}

/**
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {Set<string>}
 */
function getCanonicalFields(type) {
    switch (type) {
        case "date":
            return CANONICAL_DATE_FIELDS;
        case "dateTime":
            return CANONICAL_DATETIME_FIELDS;
        case "instant":
            return CANONICAL_INSTANT_FIELDS;
        default:
            throw new Error(`Unsupported temporal type: ${type}`);
    }
}

/**
 * @param {import('./types').CanonicalDate} canonical
 * @returns {string}
 */
function serializeDate(canonical) {
    if (!isCanonicalTemporalObject(canonical, "date")) {
        throw new Error("Cannot serialize value that is not a canonical date object");
    }

    return canonical.value;
}

/**
 * @param {import('./types').CanonicalDateTime} canonical
 * @returns {string}
 */
function serializeDateTime(canonical) {
    if (!isCanonicalTemporalObject(canonical, "dateTime")) {
        throw new Error("Cannot serialize value that is not a canonical dateTime object");
    }

    return canonical.value;
}

/**
 * @param {import('./types').CanonicalInstant} canonical
 * @returns {string}
 */
function serializeInstant(canonical) {
    if (!isCanonicalTemporalObject(canonical, "instant")) {
        throw new Error("Cannot serialize value that is not a canonical instant object");
    }

    return canonical.value;
}

/**
 * @param {import('./types').CanonicalDate | import('./types').CanonicalDateTime | import('./types').CanonicalInstant} canonical
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {string}
 */
function serializeTemporal(canonical, type) {
    switch (type) {
        case "date":
            return serializeDate(canonical);
        case "dateTime":
            return serializeDateTime(canonical);
        case "instant":
            return serializeInstant(canonical);
        default:
            throw new Error(`Unsupported temporal type: ${type}`);
    }
}

module.exports = {
    serializeDate,
    serializeDateTime,
    serializeInstant,
    serializeTemporal,
    isCanonicalTemporalObject
};
