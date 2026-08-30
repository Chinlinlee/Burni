const { issue, OperationOutcome } = require("../httpMessage");
const { isCanonicalTemporalObject } = require("./serializer");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant
} = require("./normalizer");

const TEMPORAL_ERROR_CODE = Object.freeze({
    INVALID_TEMPORAL_VALUE: "INVALID_TEMPORAL_VALUE",
    ILLEGAL_PRECISION: "ILLEGAL_PRECISION",
    MISSING_INSTANT_TIMEZONE: "MISSING_INSTANT_TIMEZONE",
    PERSISTENCE_SHAPED_INPUT: "PERSISTENCE_SHAPED_INPUT"
});

const INSTANT_DATETIME_SHAPE_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;

const PERSISTENCE_FIELD_NAMES = Object.freeze([
    "normalizedStart",
    "normalizedEnd",
    "epochSeconds"
]);

class TemporalValidationError extends Error {
    /**
     * @param {typeof TEMPORAL_ERROR_CODE[keyof typeof TEMPORAL_ERROR_CODE]} code
     * @param {string} diagnostics
     * @param {string | string[] | undefined} [path]
     */
    constructor(code, diagnostics, path) {
        super(diagnostics);
        this.name = "TemporalValidationError";
        this.code = code;
        this.diagnostics = diagnostics;
        if (path !== undefined) {
            this.path = path;
        }
    }
}

/**
 * @param {string | string[] | undefined} path
 * @returns {string | undefined}
 */
function formatTemporalPath(path) {
    if (path === undefined || path === null) {
        return undefined;
    }

    return Array.isArray(path) ? path.join(".") : String(path);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPersistenceShapedTemporalInput(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const record = /** @type {Record<string, unknown>} */ (value);
    const hasPersistenceField = PERSISTENCE_FIELD_NAMES.some((field) =>
        Object.prototype.hasOwnProperty.call(record, field)
    );
    const hasValueAndPrecision =
        Object.prototype.hasOwnProperty.call(record, "value") &&
        Object.prototype.hasOwnProperty.call(record, "precision");

    return hasPersistenceField || hasValueAndPrecision;
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 */
function assertPublicTemporalScalar(value, type, path) {
    if (isCanonicalTemporalObject(value, type)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT,
            `FHIR ${type} must be a scalar string, not a persistence-shaped temporal object`,
            path
        );
    }

    if (isPersistenceShapedTemporalInput(value)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT,
            `FHIR ${type} must be a scalar string, not a persistence-shaped temporal object`,
            path
        );
    }
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isInstantShapeWithoutTimezone(value) {
    return (
        INSTANT_DATETIME_SHAPE_PATTERN.test(value) && !TIMEZONE_SUFFIX_PATTERN.test(value)
    );
}

/**
 * @param {typeof TEMPORAL_ERROR_CODE[keyof typeof TEMPORAL_ERROR_CODE]} code
 * @returns {'invalid' | 'value'}
 */
function getFhirIssueCode(code) {
    if (code === TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT) {
        return "invalid";
    }

    return "value";
}

/**
 * @param {Error} error
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {unknown} value
 * @param {string | string[] | undefined} [path]
 * @returns {TemporalValidationError}
 */
function mapNormalizerError(error, type, value, path) {
    if (error instanceof TemporalValidationError) {
        return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (
        type === "instant" &&
        (message.includes("must include a timezone") ||
            (typeof value === "string" && isInstantShapeWithoutTimezone(value)))
    ) {
        return new TemporalValidationError(
            TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE,
            typeof value === "string" && isInstantShapeWithoutTimezone(value)
                ? `FHIR instant must include a timezone: ${value}`
                : message,
            path
        );
    }

    if (
        message.startsWith("Unable to infer") ||
        message.startsWith("Unable to derive") ||
        message.startsWith("Canonical ") ||
        message.includes("precision") ||
        message.includes("fractionDigits") ||
        message.includes("boundaries") ||
        message.startsWith("Unsupported dateTime precision") ||
        message.startsWith("Invalid fractionDigits")
    ) {
        return new TemporalValidationError(
            TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
            message,
            path
        );
    }

    return new TemporalValidationError(
        TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
        message,
        path
    );
}

/**
 * @param {TemporalValidationError} error
 * @param {string | string[] | undefined} [path]
 * @returns {import('../httpMessage').OperationOutcome}
 */
function temporalErrorToOperationOutcome(error, path) {
    const errorIssue = new issue("error", getFhirIssueCode(error.code), error.diagnostics);
    const location = error.path ?? path;

    if (location !== undefined) {
        errorIssue.location = Array.isArray(location) ? location : [formatTemporalPath(location)];
    }

    return new OperationOutcome([errorIssue]);
}

/**
 * @param {TemporalValidationError} error
 * @param {string | string[] | undefined} [path]
 * @returns {import('../httpMessage').FhirValidationError}
 */
function temporalErrorToFhirValidationError(error, path) {
    const { FhirValidationError } = require("../httpMessage");
    return new FhirValidationError(temporalErrorToOperationOutcome(error, path));
}

/**
 * @param {unknown} scalar
 * @param {string | string[] | undefined} [path]
 * @returns {import('./types').CanonicalDate}
 */
function normalizeDateSafe(scalar, path) {
    assertPublicTemporalScalar(scalar, "date", path);

    try {
        return normalizeDate(scalar);
    } catch (error) {
        throw mapNormalizerError(error, "date", scalar, path);
    }
}

/**
 * @param {unknown} scalar
 * @param {string | string[] | undefined} [path]
 * @returns {import('./types').CanonicalDateTime}
 */
function normalizeDateTimeSafe(scalar, path) {
    assertPublicTemporalScalar(scalar, "dateTime", path);

    try {
        return normalizeDateTime(scalar);
    } catch (error) {
        throw mapNormalizerError(error, "dateTime", scalar, path);
    }
}

/**
 * @param {unknown} scalar
 * @param {string | string[] | undefined} [path]
 * @returns {import('./types').CanonicalInstant}
 */
function normalizeInstantSafe(scalar, path) {
    assertPublicTemporalScalar(scalar, "instant", path);

    if (typeof scalar === "string" && isInstantShapeWithoutTimezone(scalar)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE,
            `FHIR instant must include a timezone: ${scalar}`,
            path
        );
    }

    try {
        return normalizeInstant(scalar);
    } catch (error) {
        throw mapNormalizerError(error, "instant", scalar, path);
    }
}

/**
 * @param {unknown} scalar
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 * @returns {import('./types').CanonicalDate | import('./types').CanonicalDateTime | import('./types').CanonicalInstant}
 */
function normalizeTemporalSafe(scalar, type, path) {
    switch (type) {
        case "date":
            return normalizeDateSafe(scalar, path);
        case "dateTime":
            return normalizeDateTimeSafe(scalar, path);
        case "instant":
            return normalizeInstantSafe(scalar, path);
        default:
            throw new TemporalValidationError(
                TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
                `Unsupported temporal type: ${type}`,
                path
            );
    }
}

/**
 * @param {unknown} error
 * @returns {{ status: false, code: number, result: import('../httpMessage').OperationOutcome } | undefined}
 */
function temporalErrorToWriteFailure(error) {
    if (error instanceof TemporalValidationError) {
        return {
            status: false,
            code: 422,
            result: temporalErrorToOperationOutcome(error)
        };
    }

    return undefined;
}

module.exports = {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    mapNormalizerError,
    temporalErrorToOperationOutcome,
    temporalErrorToFhirValidationError,
    temporalErrorToWriteFailure,
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe
};
