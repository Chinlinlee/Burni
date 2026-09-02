const path = require("path");
const {
    normalizeTemporalSafe,
    toPlainCanonicalValue,
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant
} = require("../../temporal");
const { detectLegacyBsonDateAmbiguity } = require("./temporalConversion");
const { fixChoiceTypeOfDate } = require("../../../../FHIR-mongoose-Models-Generator/temporalFieldMapping");

const TEMPORAL_TYPES = new Set(["date", "dateTime", "instant"]);
const TEMPORAL_CATEGORIES = Object.freeze({
    CANONICAL: "canonical",
    LEGACY_STRING: "legacy-string",
    ABSOLUTE_BSON_DATE: "absolute-bson-date",
    AMBIGUOUS_BSON_DATE: "ambiguous-bson-date",
    INVALID: "invalid"
});

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
        const ambiguity = detectLegacyBsonDateAmbiguity(value, type, fieldPath, {
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
            category:
                type === "date"
                    ? TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
                    : TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
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
 * @param {unknown} value
 * @param {object} schema
 * @param {string} fieldPath
 * @param {string} resourceType
 * @param {string} model
 * @param {Record<string, object>} definitions
 * @param {Array<object>} diagnostics
 * @param {Set<object>} activeSchemas
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
    transform = (currentValue) => currentValue
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
            return walkDefinition(
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
            return walkDefinition(
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

    return walkDefinition(
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
    transform = (currentValue) => currentValue
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
        result[propertyName] = walkSchemaValue(
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
 * @param {{ resourceType: string, model: string, documentIndex?: number }} context
 * @param {Record<string, object>} definitions
 * @returns {Array<object>}
 */
function scanTemporalDocument(document, definition, context, definitions) {
    const diagnostics = [];
    walkDefinition(
        document,
        definition,
        "",
        context.resourceType,
        context.model,
        definitions,
        diagnostics,
        new Set()
    );
    if (context.documentIndex === undefined) {
        return diagnostics;
    }
    return diagnostics.map((diagnostic) => ({
        ...diagnostic,
        documentIndex: context.documentIndex
    }));
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
    return walkDefinition(
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

/**
 * @param {object} model
 * @returns {Promise<unknown[]>}
 */
async function readModelDocuments(model) {
    if (!model || typeof model.find !== "function") {
        return [];
    }
    let query = model.find({});
    if (query && typeof query.lean === "function") {
        query = query.lean();
    }
    if (query && typeof query.exec === "function") {
        return query.exec();
    }
    if (query && typeof query.toArray === "function") {
        return query.toArray();
    }
    return Array.isArray(query) ? query : await query;
}

/**
 * @param {object | undefined} models
 * @param {string} modelName
 * @returns {object | undefined}
 */
function resolveModel(models, modelName) {
    if (
        models &&
        (typeof models[modelName] === "object" ||
            typeof models[modelName] === "function")
    ) {
        return models[modelName];
    }
    if (
        models &&
        models.models &&
        (typeof models.models[modelName] === "object" ||
            typeof models.models[modelName] === "function")
    ) {
        return models.models[modelName];
    }
    return undefined;
}

/**
 * @param {object} input
 * @param {object} [input.models]
 * @param {string[]} [input.catalog]
 * @param {Record<string, object>} [input.definitions]
 * @param {boolean} [input.includeHistory]
 * @returns {Promise<{
 *   readOnly: true,
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   sources: Array<object>,
 *   summary: Record<string, number>
 * }>}
 */
async function runTemporalMigrationPreflight({
    models = {},
    catalog = require("../../fhir.resourceList.json"),
    definitions = loadDefinitions(),
    includeHistory = true
}) {
    const diagnostics = [];
    const sources = [];
    let documentsScanned = 0;

    for (const resourceType of catalog) {
        const resourceModelName = resourceType;
        const resourceDefinition = definitions[resourceType];
        for (const source of [
            { modelName: resourceModelName, kind: "resource" },
            ...(includeHistory
                ? [{ modelName: `${resourceType}_history`, kind: "history" }]
                : [])
        ]) {
            const model = resolveModel(models, source.modelName);
            if (!model || !resourceDefinition) {
                const reason = !resourceDefinition
                    ? !model
                        ? "resource-definition-and-model-unavailable"
                        : "resource-definition-unavailable"
                    : "model-unavailable";
                const unavailableSource = {
                    resource: resourceType,
                    model: source.modelName,
                    kind: source.kind,
                    available: false,
                    documentCount: 0
                };
                sources.push({
                    ...unavailableSource
                });
                diagnostics.push({
                    code: "temporal-preflight-source-unavailable",
                    category: "unavailable-source",
                    unresolved: true,
                    message: `Temporal preflight source is unavailable: ${source.modelName}`,
                    reason,
                    ...unavailableSource
                });
                continue;
            }

            let documents;
            try {
                documents = await readModelDocuments(model);
            } catch (error) {
                const unavailableSource = {
                    resource: resourceType,
                    model: source.modelName,
                    kind: source.kind,
                    available: false,
                    documentCount: 0
                };
                sources.push(unavailableSource);
                diagnostics.push({
                    code: "temporal-preflight-source-unavailable",
                    category: "unavailable-source",
                    unresolved: true,
                    message:
                        error instanceof Error
                            ? error.message
                            : `Unable to read temporal preflight source: ${source.modelName}`,
                    reason: "source-read-failed",
                    ...unavailableSource
                });
                continue;
            }
            sources.push({
                resource: resourceType,
                model: source.modelName,
                kind: source.kind,
                available: true,
                documentCount: documents.length
            });
            for (let index = 0; index < documents.length; index++) {
                documentsScanned++;
                diagnostics.push(
                    ...scanTemporalDocument(
                        documents[index],
                        resourceDefinition,
                        {
                            resourceType,
                            model: source.modelName,
                            documentIndex: index
                        },
                        definitions
                    )
                );
            }
        }
    }

    const unavailableSources = sources.filter((source) => !source.available).length;
    const temporalDiagnostics = diagnostics.filter((diagnostic) =>
        Object.values(TEMPORAL_CATEGORIES).includes(diagnostic.category)
    );
    const summary = {
        resourcesInCatalog: catalog.length,
        sourcesScanned: sources.filter((source) => source.available).length,
        unavailableSources,
        documentsScanned,
        temporalValuesScanned: temporalDiagnostics.length,
        canonical: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.CANONICAL
        ).length,
        legacyStrings: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.LEGACY_STRING
        ).length,
        absoluteBsonDates: temporalDiagnostics.filter(
            (diagnostic) =>
                diagnostic.category === TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
        ).length,
        ambiguousBsonDates: temporalDiagnostics.filter(
            (diagnostic) =>
                diagnostic.category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
        ).length,
        invalid: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.INVALID
        ).length
    };

    return {
        readOnly: true,
        valid:
            summary.invalid === 0 &&
            summary.ambiguousBsonDates === 0 &&
            summary.unavailableSources === 0,
        diagnostics,
        sources,
        summary
    };
}

module.exports = {
    TEMPORAL_CATEGORIES,
    classifyTemporalValue,
    scanTemporalDocument,
    mapTemporalDocument,
    loadDefinitions,
    readModelDocuments,
    resolveModel,
    runTemporalMigrationPreflight,
    runMigrationPreflight: runTemporalMigrationPreflight
};
