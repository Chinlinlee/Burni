const {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    normalizeTemporalSafe,
    toPlainCanonicalValue,
    isCanonicalTemporalObject
} = require("../../temporal");

const TEMPORAL_TYPES = new Set(["date", "dateTime", "instant"]);
const AMBIGUOUS_BSON_DATE_CATEGORY = "ambiguous-bson-date";
const ABSOLUTE_BSON_DATE_CATEGORY = "absolute-bson-date";
const AMBIGUOUS_BSON_DATE_REASON =
    "Legacy BSON Date cannot be converted to FHIR date without guessing its calendar date, timezone, or precision";

/**
 * @param {unknown} context
 * @returns {{ resource?: string, model?: string }}
 */
function normalizeMigrationContext(context) {
    if (context === null || typeof context !== "object" || Array.isArray(context)) {
        return {};
    }

    const source = /** @type {Record<string, unknown>} */ (context);
    return {
        ...(typeof source.resource === "string" ? { resource: source.resource } : {}),
        ...(typeof source.model === "string" ? { model: source.model } : {})
    };
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 * @param {{ resource?: string, model?: string }} [context]
 * @returns {{
 *   ambiguous: boolean,
 *   category?: string,
 *   code?: string,
 *   temporalType: string,
 *   resource?: string,
 *   model?: string,
 *   path?: string | string[],
 *   value: unknown,
 *   reason?: string
 * }}
 */
function detectLegacyBsonDateAmbiguity(value, type, path, context) {
    const metadata = {
        temporalType: type,
        ...normalizeMigrationContext(context),
        ...(path === undefined ? {} : { path }),
        value
    };

    if (!(value instanceof Date) || type !== "date") {
        return {
            ambiguous: false,
            ...(type !== "date" && value instanceof Date
                ? { category: ABSOLUTE_BSON_DATE_CATEGORY }
                : {}),
            ...metadata
        };
    }

    if (Number.isNaN(value.getTime())) {
        return {
            ambiguous: false,
            ...metadata,
            reason: "Legacy BSON Date contains an invalid time"
        };
    }

    return {
        ambiguous: true,
        category: AMBIGUOUS_BSON_DATE_CATEGORY,
        code: TEMPORAL_ERROR_CODE.AMBIGUOUS_LEGACY_BSON_DATE,
        ...metadata,
        reason: AMBIGUOUS_BSON_DATE_REASON
    };
}

/**
 * @param {Date} value
 * @param {string | string[] | undefined} [path]
 * @param {{ resource?: string, model?: string }} [context]
 * @returns {TemporalValidationError}
 */
function createLegacyBsonDateAmbiguityError(value, path, context) {
    const metadata = detectLegacyBsonDateAmbiguity(value, "date", path, context);
    const pathText =
        path === undefined ? "<unknown path>" : Array.isArray(path) ? path.join(".") : path;
    const error = new TemporalValidationError(
        TEMPORAL_ERROR_CODE.AMBIGUOUS_LEGACY_BSON_DATE,
        `${metadata.reason} at ${pathText}: ${value.toISOString()}`,
        path
    );
    error.temporalType = "date";
    error.category = AMBIGUOUS_BSON_DATE_CATEGORY;
    error.value = value;
    Object.assign(error, normalizeMigrationContext(context));
    return error;
}

/**
 * @param {unknown} value
 * @param {string} type
 * @param {string | string[] | undefined} [path]
 * @returns {asserts value is string}
 */
function assertLegacyTemporalString(value, type, path) {
    if (!TEMPORAL_TYPES.has(type)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Unsupported temporal type: ${type}`,
            path
        );
    }

    if (typeof value !== "string") {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Legacy FHIR ${type} value must be a string`,
            path
        );
    }
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 * @param {{ resource?: string, model?: string }} [context]
 * @returns {import('../../temporal/types').CanonicalDate | import('../../temporal/types').CanonicalDateTime | import('../../temporal/types').CanonicalInstant}
 */
function convertLegacyBsonDate(value, type, path, context) {
    if (!TEMPORAL_TYPES.has(type)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Unsupported temporal type: ${type}`,
            path
        );
    }

    if (!(value instanceof Date)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            "Legacy temporal value must be a BSON Date",
            path
        );
    }

    if (type === "date") {
        throw createLegacyBsonDateAmbiguityError(value, path, context);
    }

    if (Number.isNaN(value.getTime())) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            "Legacy BSON Date contains an invalid time",
            path
        );
    }

    return normalizeTemporalSafe(value.toISOString(), type, path);
}

/**
 * Preserve canonical persistence values so repeated migration does not rewrap
 * or recreate their Decimal128 fields.
 *
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 * @param {{ resource?: string, model?: string }} [context]
 * @returns {import('../../temporal/types').CanonicalDate | import('../../temporal/types').CanonicalDateTime | import('../../temporal/types').CanonicalInstant}
 */
function convertLegacyTemporalValue(value, type, path, context) {
    if (!TEMPORAL_TYPES.has(type)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Unsupported temporal type: ${type}`,
            path
        );
    }

    const plain = toPlainCanonicalValue(value);
    if (isCanonicalTemporalObject(plain, type)) {
        return { ...plain };
    }

    if (value instanceof Date) {
        return convertLegacyBsonDate(value, type, path, context);
    }

    assertLegacyTemporalString(value, type, path);
    return normalizeTemporalSafe(value, type, path);
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string | string[] | undefined} [path]
 * @returns {import('../../temporal/types').CanonicalDate | import('../../temporal/types').CanonicalDateTime | import('../../temporal/types').CanonicalInstant}
 */
function convertLegacyTemporalString(value, type, path) {
    assertLegacyTemporalString(value, type, path);
    return normalizeTemporalSafe(value, type, path);
}

module.exports = {
    detectLegacyBsonDateAmbiguity,
    createLegacyBsonDateAmbiguityError,
    convertLegacyTemporalValue,
    convertLegacyTemporalString,
    convertLegacyBsonDate
};
