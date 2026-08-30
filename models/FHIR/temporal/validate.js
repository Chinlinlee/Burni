const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES,
    CANONICAL_DATE_FIELDS,
    CANONICAL_DATETIME_FIELDS,
    CANONICAL_INSTANT_FIELDS
} = require("./constants");
const { inferDatePrecision, inferDateTimePrecision, inferInstantPrecision } = require("./lexical");
const { isCalendarDate, compareCalendarDates, expectedDateBoundaries } = require("./calendar");
const { isDecimal128, compareDecimal128 } = require("./decimal128");
const { parseDateTimeToUtcEpoch, expectedDateTimeBoundaries } = require("./epoch");

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Mongoose nested paths pass a Subdocument into schema validators.
 * Canonical validation must see only persistence fields.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function toPlainCanonicalValue(value) {
    if (value == null || typeof value !== "object") {
        return value;
    }

    const source =
        value._doc && typeof value._doc === "object"
            ? value._doc
            : typeof value.toObject === "function"
              ? value.toObject()
              : value;

    if (!source || typeof source !== "object" || Array.isArray(source)) {
        return source;
    }

    /** @type {Record<string, unknown>} */
    const plain = {};
    for (const [key, fieldValue] of Object.entries(source)) {
        if (key.startsWith("$") || key === "_doc") {
            continue;
        }
        plain[key] = fieldValue;
    }
    return plain;
}

/**
 * @param {Record<string, unknown>} value
 * @param {Set<string>} allowedFields
 * @param {string[]} errors
 * @param {string} label
 */
function validateAllowedFields(value, allowedFields, errors, label) {
    for (const field of Object.keys(value)) {
        if (!allowedFields.has(field)) {
            errors.push(`${label} has unexpected field: ${field}`);
        }
    }
}

/**
 * @param {unknown} fractionDigits
 * @param {string} precision
 * @param {string} fractionPrecision
 * @param {string[]} errors
 * @param {string} label
 */
function validateFractionDigits(fractionDigits, precision, fractionPrecision, errors, label) {
    if (precision === fractionPrecision) {
        if (!Number.isInteger(fractionDigits) || fractionDigits <= 0) {
            errors.push(`${label}.fractionDigits must be a positive integer when precision is ${fractionPrecision}`);
        }
        return;
    }

    if (fractionDigits !== undefined && fractionDigits !== null) {
        errors.push(`${label}.fractionDigits must be omitted unless precision is ${fractionPrecision}`);
    }
}

/**
 * @param {unknown} value
 * @returns {import('./types').TemporalValidationResult}
 */
function validateCanonicalDate(value) {
    /** @type {string[]} */
    const errors = [];

    if (!isPlainObject(value)) {
        return { valid: false, errors: ["Canonical date must be a plain object"] };
    }

    validateAllowedFields(value, CANONICAL_DATE_FIELDS, errors, "Canonical date");

    if (typeof value.value !== "string" || value.value.length === 0) {
        errors.push("Canonical date.value must be a non-empty string");
    } else if (!DATE_PATTERN.test(value.value)) {
        errors.push("Canonical date.value must match the FHIR date pattern");
    }

    if (!DATE_PRECISION_VALUES.has(value.precision)) {
        errors.push("Canonical date.precision must be year, month, or day");
    }

    if (typeof value.normalizedStart !== "string" || !isCalendarDate(value.normalizedStart)) {
        errors.push("Canonical date.normalizedStart must be a valid YYYY-MM-DD calendar date");
    }

    if (typeof value.normalizedEnd !== "string" || !isCalendarDate(value.normalizedEnd)) {
        errors.push("Canonical date.normalizedEnd must be a valid YYYY-MM-DD calendar date");
    }

    if (
        typeof value.normalizedStart === "string" &&
        typeof value.normalizedEnd === "string" &&
        isCalendarDate(value.normalizedStart) &&
        isCalendarDate(value.normalizedEnd) &&
        compareCalendarDates(value.normalizedStart, value.normalizedEnd) >= 0
    ) {
        errors.push("Canonical date.normalizedEnd must be after normalizedStart");
    }

    if (typeof value.value === "string" && DATE_PATTERN.test(value.value)) {
        const inferredPrecision = inferDatePrecision(value.value);
        if (inferredPrecision !== value.precision) {
            errors.push("Canonical date.precision must match the lexical precision of value");
        }

        if (DATE_PRECISION_VALUES.has(value.precision)) {
            const expected = expectedDateBoundaries(value.value, value.precision);
            if (
                expected &&
                (value.normalizedStart !== expected.normalizedStart ||
                    value.normalizedEnd !== expected.normalizedEnd)
            ) {
                errors.push("Canonical date normalized boundaries must match value and precision");
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @param {unknown} value
 * @returns {import('./types').TemporalValidationResult}
 */
function validateCanonicalDateTime(value) {
    /** @type {string[]} */
    const errors = [];

    if (!isPlainObject(value)) {
        return { valid: false, errors: ["Canonical dateTime must be a plain object"] };
    }

    validateAllowedFields(value, CANONICAL_DATETIME_FIELDS, errors, "Canonical dateTime");

    if (typeof value.value !== "string" || value.value.length === 0) {
        errors.push("Canonical dateTime.value must be a non-empty string");
    } else if (!DATETIME_PATTERN.test(value.value)) {
        errors.push("Canonical dateTime.value must match the FHIR dateTime pattern");
    }

    if (!DATETIME_PRECISION_VALUES.has(value.precision)) {
        errors.push(
            "Canonical dateTime.precision must be year, month, day, minute, second, or fraction"
        );
    }

    validateFractionDigits(
        value.fractionDigits,
        value.precision,
        DATETIME_PRECISION.FRACTION,
        errors,
        "Canonical dateTime"
    );

    if (!isDecimal128(value.normalizedStart)) {
        errors.push("Canonical dateTime.normalizedStart must be a Decimal128 value");
    }

    if (!isDecimal128(value.normalizedEnd)) {
        errors.push("Canonical dateTime.normalizedEnd must be a Decimal128 value");
    }

    if (
        isDecimal128(value.normalizedStart) &&
        isDecimal128(value.normalizedEnd) &&
        compareDecimal128(value.normalizedStart, value.normalizedEnd) >= 0
    ) {
        errors.push("Canonical dateTime.normalizedEnd must be after normalizedStart");
    }

    if (typeof value.value === "string" && DATETIME_PATTERN.test(value.value)) {
        const inferred = inferDateTimePrecision(value.value);
        if (!inferred) {
            errors.push("Canonical dateTime.value has unsupported lexical precision");
        } else {
            if (inferred.precision !== value.precision) {
                errors.push("Canonical dateTime.precision must match the lexical precision of value");
            }

            if (inferred.precision === DATETIME_PRECISION.FRACTION) {
                if (value.fractionDigits !== inferred.fractionDigits) {
                    errors.push("Canonical dateTime.fractionDigits must match the fractional digits in value");
                }
            }

            if (
                DATETIME_PRECISION_VALUES.has(value.precision) &&
                isDecimal128(value.normalizedStart) &&
                isDecimal128(value.normalizedEnd)
            ) {
                try {
                    const expected = expectedDateTimeBoundaries(
                        value.value,
                        value.precision,
                        value.fractionDigits
                    );
                    if (
                        compareDecimal128(value.normalizedStart, expected.normalizedStart) !== 0 ||
                        compareDecimal128(value.normalizedEnd, expected.normalizedEnd) !== 0
                    ) {
                        errors.push(
                            "Canonical dateTime normalized boundaries must match value and precision"
                        );
                    }
                } catch {
                    errors.push("Canonical dateTime normalized boundaries must match value and precision");
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @param {unknown} value
 * @returns {import('./types').TemporalValidationResult}
 */
function validateCanonicalInstant(value) {
    /** @type {string[]} */
    const errors = [];

    if (!isPlainObject(value)) {
        return { valid: false, errors: ["Canonical instant must be a plain object"] };
    }

    validateAllowedFields(value, CANONICAL_INSTANT_FIELDS, errors, "Canonical instant");

    if (typeof value.value !== "string" || value.value.length === 0) {
        errors.push("Canonical instant.value must be a non-empty string");
    } else if (!INSTANT_PATTERN.test(value.value)) {
        errors.push("Canonical instant.value must match the FHIR instant pattern");
    }

    if (!INSTANT_PRECISION_VALUES.has(value.precision)) {
        errors.push("Canonical instant.precision must be second or fraction");
    }

    validateFractionDigits(
        value.fractionDigits,
        value.precision,
        INSTANT_PRECISION.FRACTION,
        errors,
        "Canonical instant"
    );

    if (!isDecimal128(value.epochSeconds)) {
        errors.push("Canonical instant.epochSeconds must be a Decimal128 value");
    }

    if (typeof value.value === "string" && INSTANT_PATTERN.test(value.value)) {
        const inferred = inferInstantPrecision(value.value);
        if (!inferred) {
            errors.push("Canonical instant.value has unsupported lexical precision");
        } else {
            if (inferred.precision !== value.precision) {
                errors.push("Canonical instant.precision must match the lexical precision of value");
            }

            if (inferred.precision === INSTANT_PRECISION.FRACTION) {
                if (value.fractionDigits !== inferred.fractionDigits) {
                    errors.push("Canonical instant.fractionDigits must match the fractional digits in value");
                }
            }

            if (isDecimal128(value.epochSeconds)) {
                const expectedEpoch = parseDateTimeToUtcEpoch(value.value);
                if (compareDecimal128(value.epochSeconds, expectedEpoch) !== 0) {
                    errors.push("Canonical instant.epochSeconds must match value");
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant,
    toPlainCanonicalValue
};
