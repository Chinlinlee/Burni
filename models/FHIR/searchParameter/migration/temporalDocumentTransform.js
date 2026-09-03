const path = require("path");
const {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    normalizeTemporalSafe,
    toPlainCanonicalValue,
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant,
    isCanonicalTemporalObject
} = require("../../temporal");
const { fixChoiceTypeOfDate } = require("../../../../FHIR-mongoose-Models-Generator/temporalFieldMapping");

const TEMPORAL_TYPES = new Set(["date", "dateTime", "instant"]);
const TEMPORAL_CATEGORIES = Object.freeze({
    CANONICAL: "canonical",
    LEGACY_STRING: "legacy-string",
    ABSOLUTE_BSON_DATE: "absolute-bson-date",
    AMBIGUOUS_BSON_DATE: "ambiguous-bson-date",
    INVALID: "invalid"
});
const AMBIGUOUS_BSON_DATE_CATEGORY = TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE;
const ABSOLUTE_BSON_DATE_CATEGORY = TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE;
const CONVERSION_POLICY = Object.freeze({
    LEGACY_STRING: "legacy-string",
    UTC_CALENDAR_DAY_LOSSY: "utc-calendar-day-lossy",
    UTC_ABSOLUTE_TIME_LOSSY: "utc-absolute-time-lossy"
});
const UTC_CALENDAR_DAY_LOSSY_POLICY = CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY;
const UTC_ABSOLUTE_TIME_LOSSY_POLICY = CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY;
const AMBIGUOUS_BSON_DATE_REASON =
    "Legacy BSON Date cannot be converted to FHIR date without guessing its calendar date, timezone, or precision";

/**
 * @param {unknown} ref
 * @returns {string | undefined}
 */
function definitionNameFromRef(ref) {
    if (typeof ref !== "string") {
        return undefined;
    }
    const segments = ref.split("/");
    return segments[segments.length - 1];
}

/**
 * @returns {Record<string, object>}
 */
function loadDefinitions() {
    const schema = require(path.join(
        __dirname,
        "../../../../FHIR-mongoose-Models-Generator/fhir.schema.json"
    ));
    return schema.definitions;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasCanonicalField(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const record = /** @type {Record<string, unknown>} */ (value);
    return (
        Object.prototype.hasOwnProperty.call(record, "value") ||
        Object.prototype.hasOwnProperty.call(record, "precision") ||
        Object.prototype.hasOwnProperty.call(record, "normalizedStart") ||
        Object.prototype.hasOwnProperty.call(record, "normalizedEnd") ||
        Object.prototype.hasOwnProperty.call(record, "epochSeconds")
    );
}

/**
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} type
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCanonical(value, type) {
    const plain = toPlainCanonicalValue(value);
    switch (type) {
        case "date":
            return validateCanonicalDate(plain);
        case "dateTime":
            return validateCanonicalDateTime(plain);
        case "instant":
            return validateCanonicalInstant(plain);
        default:
            return { valid: false, errors: [`Unsupported temporal type: ${type}`] };
    }
}

/**
 * @param {Date} value
 * @returns {string}
 */
function formatUtcCalendarDate(value) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

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
 * @param {string} category
 * @param {"date" | "dateTime" | "instant"} temporalType
 * @returns {string}
 */
function resolveConversionPolicy(category, temporalType) {
    if (
        category === TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE ||
        category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
    ) {
        if (temporalType === "date") {
            return CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY;
        }
        if (temporalType === "dateTime" || temporalType === "instant") {
            return CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY;
        }
    }
    return CONVERSION_POLICY.LEGACY_STRING;
}

/**
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {string}
 */
function resolveBsonDateConversionPolicy(type) {
    if (type === "date") {
        return CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY;
    }
    if (type === "dateTime" || type === "instant") {
        return CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY;
    }
    throw new TemporalValidationError(
        TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
        `Unsupported temporal type: ${type}`
    );
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

    if (!(value instanceof Date)) {
        return {
            ambiguous: false,
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
        ambiguous: false,
        category: ABSOLUTE_BSON_DATE_CATEGORY,
        policy: resolveBsonDateConversionPolicy(type),
        ...metadata
    };
}

/**
 * @param {Date} value
 * @param {string | string[] | undefined} [path]
 * @param {{ resource?: string, model?: string }} [context]
 * @returns {TemporalValidationError}
 */
function createLegacyBsonDateAmbiguityError(value, path, context) {
    const pathText =
        path === undefined ? "<unknown path>" : Array.isArray(path) ? path.join(".") : path;
    const error = new TemporalValidationError(
        TEMPORAL_ERROR_CODE.AMBIGUOUS_LEGACY_BSON_DATE,
        `${AMBIGUOUS_BSON_DATE_REASON} at ${pathText}: ${value.toISOString()}`,
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
 * @param {Date} value
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

    if (Number.isNaN(value.getTime())) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            "Legacy BSON Date contains an invalid time",
            path
        );
    }

    if (type === "date") {
        return normalizeTemporalSafe(formatUtcCalendarDate(value), type, path);
    }

    return normalizeTemporalSafe(value.toISOString(), type, path);
}

/**
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

/**
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} type
 * @param {string} resourceType
 * @param {string} model
 * @param {string} fieldPath
 * @returns {{
 *   category: string,
 *   temporalType: string,
 *   resource: string,
 *   model: string,
 *   path: string,
 *   value: unknown,
 *   reason?: string
 * }}
 */
function classifyTemporalValue(value, type, resourceType, model, fieldPath) {
    const base = {
        temporalType: type,
        resource: resourceType,
        model,
        path: fieldPath,
        value
    };

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return {
                ...base,
                category: TEMPORAL_CATEGORIES.INVALID,
                reason: "BSON Date contains an invalid time"
            };
        }
        if (type === "date") {
            return {
                ...base,
                category: TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
            };
        }
        const ambiguity = module.exports.detectLegacyBsonDateAmbiguity(value, type, fieldPath, {
            resource: resourceType,
            model
        });
        if (ambiguity.ambiguous) {
            return {
                ...base,
                category: TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE,
                code: ambiguity.code,
                reason: ambiguity.reason
            };
        }
        return {
            ...base,
            category: TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
        };
    }

    if (typeof value === "string") {
        try {
            normalizeTemporalSafe(value, type, fieldPath);
            return {
                ...base,
                category: TEMPORAL_CATEGORIES.LEGACY_STRING
            };
        } catch (error) {
            return {
                ...base,
                category: TEMPORAL_CATEGORIES.INVALID,
                reason: error instanceof Error ? error.message : String(error)
            };
        }
    }

    if (hasCanonicalField(value)) {
        const validation = validateCanonical(value, type);
        return {
            ...base,
            category: validation.valid
                ? TEMPORAL_CATEGORIES.CANONICAL
                : TEMPORAL_CATEGORIES.INVALID,
            ...(validation.valid
                ? {}
                : { reason: validation.errors.join("; ") })
        };
    }

    return {
        ...base,
        category: TEMPORAL_CATEGORIES.INVALID,
        reason: `Expected a legacy string, BSON Date, or canonical ${type} object`
    };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {string[]} segments
 * @param {string | number} segment
 * @returns {string}
 */
function appendPath(segments, segment) {
    if (typeof segment === "number") {
        return `${segments.join("")}[${segment}]`;
    }
    if (segments.length === 0) {
        return segment;
    }
    return `${segments.join("")}.${segment}`;
}

/**
 * @param {object} classification
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} type
 * @param {string} path
 * @param {{ resource?: string, model?: string }} migrationContext
 * @param {import("./migrationContracts").AuditRecord[]} auditEntries
 * @param {object[]} diagnostics
 * @param {import("./migrationContracts").MigrationTransformContext | undefined} auditContext
 * @returns {unknown}
 */
function convertClassifiedTemporalValue(
    classification,
    value,
    type,
    path,
    migrationContext,
    auditEntries,
    diagnostics,
    auditContext
) {
    if (classification.category === TEMPORAL_CATEGORIES.CANONICAL) {
        return value;
    }

    if (classification.category === TEMPORAL_CATEGORIES.INVALID) {
        const error = new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            classification.reason || `Invalid temporal value at ${path}`,
            path
        );
        error.value = value;
        error.category = classification.category;
        throw error;
    }

    if (classification.category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE) {
        throw createLegacyBsonDateAmbiguityError(
            /** @type {Date} */ (value),
            path,
            migrationContext
        );
    }

    const converted = convertLegacyTemporalValue(value, type, path, migrationContext);
    if (auditContext) {
        const { runIdentity, source, batchId } = auditContext;
        const sourceDocument = auditContext.sourceDocument;
        auditEntries.push({
            sourceDatabaseIdentity: runIdentity.sourceDatabaseIdentity,
            sourceCollection: source.collectionName,
            sourceDocumentId:
                sourceDocument?._id ?? sourceDocument?.id ?? auditContext.sourceDocumentId,
            fhirPath: path,
            temporalType: type,
            policy: resolveConversionPolicy(classification.category, type),
            originalValue: value,
            generatedValue: converted
        });
        diagnostics.push({
            category: classification.category,
            temporalType: type,
            resource: classification.resource,
            model: classification.model,
            path,
            batchId
        });
    }
    return converted;
}

/**
 * @param {unknown} value
 * @param {object} schema
 * @param {string} fieldPath
 * @param {string} resourceType
 * @param {string} model
 * @param {Record<string, object>} definitions
 * @param {Array<object>} diagnostics
 * @param {Set<object>} activeSchemas
 * @param {"preflight" | "write"} mode
 * @param {{ resource?: string, model?: string }} migrationContext
 * @param {import("./migrationContracts").AuditRecord[]} auditEntries
 * @param {import("./migrationContracts").MigrationTransformContext | undefined} auditContext
 */
function walkSchemaValue(
    value,
    schema,
    fieldPath,
    resourceType,
    model,
    definitions,
    diagnostics,
    activeSchemas,
    mode,
    migrationContext,
    auditEntries,
    auditContext
) {
    if (value === undefined || value === null || !schema) {
        return value;
    }

    if (schema.type === "array") {
        if (!Array.isArray(value)) {
            return value;
        }
        return value.map((item, index) =>
            walkSchemaValue(
                item,
                schema.items || {},
                appendPath(fieldPath ? [fieldPath] : [], index),
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                mode,
                migrationContext,
                auditEntries,
                auditContext
            )
        );
    }

    const refName = definitionNameFromRef(schema.$ref);
    const schemaType = TEMPORAL_TYPES.has(schema.type) ? schema.type : refName;
    if (schemaType && TEMPORAL_TYPES.has(schemaType)) {
        const temporalType = /** @type {"date" | "dateTime" | "instant"} */ (schemaType);
        const classification = classifyTemporalValue(
            value,
            temporalType,
            resourceType,
            model,
            fieldPath
        );
        if (mode === "preflight") {
            diagnostics.push(classification);
            return value;
        }
        return convertClassifiedTemporalValue(
            classification,
            value,
            temporalType,
            fieldPath,
            migrationContext,
            auditEntries,
            diagnostics,
            auditContext
        );
    }

    if (refName === "ResourceList") {
        if (!isObject(value) || typeof value.resourceType !== "string") {
            return value;
        }
        const resourceDefinition = definitions[value.resourceType];
        if (resourceDefinition) {
            return walkDefinition(
                value,
                resourceDefinition,
                fieldPath,
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                mode,
                migrationContext,
                auditEntries,
                auditContext
            );
        }
        return value;
    }

    if (refName) {
        const referencedDefinition = definitions[refName];
        if (referencedDefinition) {
            return walkDefinition(
                value,
                referencedDefinition,
                fieldPath,
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                mode,
                migrationContext,
                auditEntries,
                auditContext
            );
        }
        return value;
    }

    return walkDefinition(
        value,
        schema,
        fieldPath,
        resourceType,
        model,
        definitions,
        diagnostics,
        activeSchemas,
        mode,
        migrationContext,
        auditEntries,
        auditContext
    );
}

/**
 * @param {unknown} value
 * @param {object} definition
 * @param {string} fieldPath
 * @param {string} resourceType
 * @param {string} model
 * @param {Record<string, object>} definitions
 * @param {Array<object>} diagnostics
 * @param {Set<object>} activeSchemas
 * @param {"preflight" | "write"} mode
 * @param {{ resource?: string, model?: string }} migrationContext
 * @param {import("./migrationContracts").AuditRecord[]} auditEntries
 * @param {import("./migrationContracts").MigrationTransformContext | undefined} auditContext
 */
function walkDefinition(
    value,
    definition,
    fieldPath,
    resourceType,
    model,
    definitions,
    diagnostics,
    activeSchemas,
    mode,
    migrationContext,
    auditEntries,
    auditContext
) {
    if (!isObject(value) || activeSchemas.has(definition)) {
        return value;
    }

    const properties = definition.properties;
    if (!properties) {
        return value;
    }

    const result = { ...value };
    activeSchemas.add(definition);
    for (const [propertyName, propertySchema] of Object.entries(properties)) {
        if (propertyName.startsWith("_")) {
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(value, propertyName)) {
            continue;
        }
        const childPath = fieldPath
            ? `${fieldPath}.${propertyName}`
            : propertyName;
        const choice = fixChoiceTypeOfDate(propertyName, propertySchema.type);
        if (choice.yes && TEMPORAL_TYPES.has(choice.type)) {
            const temporalType = /** @type {"date" | "dateTime" | "instant"} */ (choice.type);
            const classification = classifyTemporalValue(
                value[propertyName],
                temporalType,
                resourceType,
                model,
                childPath
            );
            if (mode === "preflight") {
                diagnostics.push(classification);
                continue;
            }
            result[propertyName] = convertClassifiedTemporalValue(
                classification,
                value[propertyName],
                temporalType,
                childPath,
                migrationContext,
                auditEntries,
                diagnostics,
                auditContext
            );
            continue;
        }
        result[propertyName] = walkSchemaValue(
            value[propertyName],
            propertySchema,
            childPath,
            resourceType,
            model,
            definitions,
            diagnostics,
            activeSchemas,
            mode,
            migrationContext,
            auditEntries,
            auditContext
        );
    }
    activeSchemas.delete(definition);
    return result;
}

/**
 * @param {unknown} document
 * @param {object} definition
 * @param {{ resourceType: string, model: string, documentIndex?: number }} context
 * @param {Record<string, object>} definitions
 * @param {{
 *   mode: "preflight" | "write",
 *   auditContext?: import("./migrationContracts").MigrationTransformContext & {
 *     sourceDocument?: object,
 *     sourceDocumentId?: unknown
 *   }
 * }} options
 * @returns {{
 *   diagnostics: Array<object>,
 *   document?: unknown,
 *   auditEntries?: import("./migrationContracts").AuditRecord[]
 * }}
 */
function processTemporalDocument(document, definition, context, definitions, options) {
    const diagnostics = [];
    const auditEntries = [];
    const migrationContext = {
        resource: context.resourceType,
        model: context.model
    };
    const auditContext =
        options.mode === "write" ? options.auditContext : undefined;

    const documentResult =
        options.mode === "write"
            ? walkDefinition(
                  document,
                  definition,
                  "",
                  context.resourceType,
                  context.model,
                  definitions,
                  diagnostics,
                  new Set(),
                  options.mode,
                  migrationContext,
                  auditEntries,
                  auditContext
              )
            : document;

    if (options.mode === "preflight") {
        walkDefinition(
            document,
            definition,
            "",
            context.resourceType,
            context.model,
            definitions,
            diagnostics,
            new Set(),
            options.mode,
            migrationContext,
            auditEntries,
            auditContext
        );
    }

    const mappedDiagnostics =
        context.documentIndex === undefined
            ? diagnostics
            : diagnostics.map((diagnostic) => ({
                  ...diagnostic,
                  documentIndex: context.documentIndex
              }));

    if (options.mode === "preflight") {
        return { diagnostics: mappedDiagnostics };
    }

    return {
        document: documentResult,
        auditEntries,
        diagnostics: mappedDiagnostics
    };
}

/**
 * @param {unknown} document
 * @param {object} definition
 * @param {{ resourceType: string, model: string, documentIndex?: number }} context
 * @param {Record<string, object>} definitions
 * @returns {Array<object>}
 */
function scanTemporalDocument(document, definition, context, definitions) {
    return processTemporalDocument(document, definition, context, definitions, {
        mode: "preflight"
    }).diagnostics;
}

/**
 * @param {unknown} value
 * @param {object} schema
 * @param {string} fieldPath
 * @param {string} resourceType
 * @param {string} model
 * @param {Record<string, object>} definitions
 * @param {Array<object>} diagnostics
 * @param {Set<object>} activeSchemas
 * @param {(value: unknown, type: "date" | "dateTime" | "instant", path: string) => unknown} transform
 */
function walkSchemaValueWithTransform(
    value,
    schema,
    fieldPath,
    resourceType,
    model,
    definitions,
    diagnostics,
    activeSchemas,
    transform
) {
    if (value === undefined || value === null || !schema) {
        return value;
    }

    if (schema.type === "array") {
        if (!Array.isArray(value)) {
            return value;
        }
        return value.map((item, index) =>
            walkSchemaValueWithTransform(
                item,
                schema.items || {},
                appendPath(fieldPath ? [fieldPath] : [], index),
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                transform
            )
        );
    }

    const refName = definitionNameFromRef(schema.$ref);
    const schemaType = TEMPORAL_TYPES.has(schema.type) ? schema.type : refName;
    if (schemaType && TEMPORAL_TYPES.has(schemaType)) {
        const temporalType = /** @type {"date" | "dateTime" | "instant"} */ (schemaType);
        diagnostics.push(
            classifyTemporalValue(
                value,
                temporalType,
                resourceType,
                model,
                fieldPath
            )
        );
        return transform(value, temporalType, fieldPath);
    }

    if (refName === "ResourceList") {
        if (!isObject(value) || typeof value.resourceType !== "string") {
            return value;
        }
        const resourceDefinition = definitions[value.resourceType];
        if (resourceDefinition) {
            return walkDefinitionWithTransform(
                value,
                resourceDefinition,
                fieldPath,
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                transform
            );
        }
        return value;
    }

    if (refName) {
        const referencedDefinition = definitions[refName];
        if (referencedDefinition) {
            return walkDefinitionWithTransform(
                value,
                referencedDefinition,
                fieldPath,
                resourceType,
                model,
                definitions,
                diagnostics,
                activeSchemas,
                transform
            );
        }
        return value;
    }

    return walkDefinitionWithTransform(
        value,
        schema,
        fieldPath,
        resourceType,
        model,
        definitions,
        diagnostics,
        activeSchemas,
        transform
    );
}

/**
 * @param {unknown} value
 * @param {object} definition
 * @param {string} fieldPath
 * @param {string} resourceType
 * @param {string} model
 * @param {Record<string, object>} definitions
 * @param {Array<object>} diagnostics
 * @param {Set<object>} activeSchemas
 * @param {(value: unknown, type: "date" | "dateTime" | "instant", path: string) => unknown} transform
 */
function walkDefinitionWithTransform(
    value,
    definition,
    fieldPath,
    resourceType,
    model,
    definitions,
    diagnostics,
    activeSchemas,
    transform
) {
    if (!isObject(value) || activeSchemas.has(definition)) {
        return value;
    }

    const properties = definition.properties;
    if (!properties) {
        return value;
    }

    const result = { ...value };
    activeSchemas.add(definition);
    for (const [propertyName, propertySchema] of Object.entries(properties)) {
        if (propertyName.startsWith("_")) {
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(value, propertyName)) {
            continue;
        }
        const childPath = fieldPath
            ? `${fieldPath}.${propertyName}`
            : propertyName;
        const choice = fixChoiceTypeOfDate(propertyName, propertySchema.type);
        if (choice.yes && TEMPORAL_TYPES.has(choice.type)) {
            diagnostics.push(
                classifyTemporalValue(
                    value[propertyName],
                    choice.type,
                    resourceType,
                    model,
                    childPath
                )
            );
            result[propertyName] = transform(value[propertyName], choice.type, childPath);
            continue;
        }
        result[propertyName] = walkSchemaValueWithTransform(
            value[propertyName],
            propertySchema,
            childPath,
            resourceType,
            model,
            definitions,
            diagnostics,
            activeSchemas,
            transform
        );
    }
    activeSchemas.delete(definition);
    return result;
}

/**
 * @param {unknown} document
 * @param {object} definition
 * @param {{ resourceType: string, model: string }} context
 * @param {Record<string, object>} definitions
 * @param {(value: unknown, type: "date" | "dateTime" | "instant", path: string) => unknown} transform
 * @returns {unknown}
 */
function mapTemporalDocument(document, definition, context, definitions, transform) {
    return walkDefinitionWithTransform(
        document,
        definition,
        "",
        context.resourceType,
        context.model,
        definitions,
        [],
        new Set(),
        transform
    );
}

module.exports = {
    TEMPORAL_CATEGORIES,
    CONVERSION_POLICY,
    UTC_CALENDAR_DAY_LOSSY_POLICY,
    UTC_ABSOLUTE_TIME_LOSSY_POLICY,
    ABSOLUTE_BSON_DATE_CATEGORY,
    classifyTemporalValue,
    resolveConversionPolicy,
    resolveBsonDateConversionPolicy,
    detectLegacyBsonDateAmbiguity,
    createLegacyBsonDateAmbiguityError,
    convertLegacyTemporalValue,
    convertLegacyTemporalString,
    convertLegacyBsonDate,
    formatUtcCalendarDate,
    processTemporalDocument,
    scanTemporalDocument,
    mapTemporalDocument,
    loadDefinitions
};
