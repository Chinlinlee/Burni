const path = require("path");
const _ = require("lodash");
const { fixChoiceTypeOfDate } = require("../../../FHIR-mongoose-Models-Generator/temporalFieldMapping");
const {
    TemporalValidationError,
    TEMPORAL_ERROR_CODE,
    normalizeTemporalSafe
} = require("./errors");
const {
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES
} = require("./constants");
const { toPlainCanonicalValue } = require("./validate");
const { isCanonicalTemporalObject, serializeTemporal } = require("./serializer");

const TEMPORAL_TYPES = new Set(["date", "dateTime", "instant"]);

/** @type {Record<string, object> | undefined} */
let fhirDefinitions;

/**
 * @returns {Record<string, object>}
 */
function loadFhirDefinitions() {
    if (!fhirDefinitions) {
        const schemaJson = require(path.join(
            __dirname,
            "../../../FHIR-mongoose-Models-Generator/fhir.schema.json"
        ));
        fhirDefinitions = schemaJson.definitions;
    }
    return fhirDefinitions;
}

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
 * @param {string | string[]} pathSegments
 * @returns {string}
 */
function formatWalkPath(pathSegments) {
    return Array.isArray(pathSegments) ? pathSegments.join(".") : String(pathSegments);
}

/**
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {ReadonlySet<string>}
 */
function precisionValuesForType(type) {
    switch (type) {
        case "date":
            return DATE_PRECISION_VALUES;
        case "dateTime":
            return DATETIME_PRECISION_VALUES;
        case "instant":
            return INSTANT_PRECISION_VALUES;
        default:
            return new Set();
    }
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Unwrap a stored canonical temporal to the original FHIR scalar.
 * Extra mongoose keys or Decimal128 wrapping must not block taking `.value`.
 *
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @returns {unknown}
 */
function serializeStoredTemporal(value, type) {
    if (typeof value === "string") {
        return value;
    }

    const plain = toPlainCanonicalValue(value);
    if (typeof plain === "string") {
        return plain;
    }

    if (isCanonicalTemporalObject(plain, type)) {
        return serializeTemporal(plain, type);
    }

    if (
        isPlainObject(plain) &&
        typeof plain.value === "string" &&
        plain.value.length > 0 &&
        precisionValuesForType(type).has(/** @type {string} */ (plain.precision))
    ) {
        return plain.value;
    }

    return value;
}

/**
 * @param {unknown} resource
 * @returns {object}
 */
function assertResourceObject(resource) {
    if (resource === undefined || resource === null || typeof resource !== "object" || Array.isArray(resource)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            "FHIR resource must be an object"
        );
    }

    const resourceType = /** @type {{ resourceType?: unknown }} */ (resource).resourceType;
    if (typeof resourceType !== "string" || resourceType.length === 0) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            "FHIR resource must have a resourceType"
        );
    }

    const definitions = loadFhirDefinitions();
    const definition = definitions[resourceType];
    if (!definition) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Unknown resource type: ${resourceType}`
        );
    }

    return { resourceType, definition, definitions };
}

/**
 * Public FHIR resource JSON in, clone with date/dateTime/instant scalars replaced
 * by canonical objects. Does not hit MongoDB.
 *
 * @param {unknown} resource
 * @returns {object}
 */
function normalizeResourceTemporals(resource) {
    const { definition, definitions } = assertResourceObject(resource);
    const clone = _.cloneDeep(resource);
    walkNode(clone, definition, [/** @type {{ resourceType: string }} */ (clone).resourceType], definitions, "normalize");
    return clone;
}

/**
 * FHIR-shaped JSON in (canonical objects or already-scalar strings), clone with
 * temporal primitives unwrapped to the original `value` string.
 *
 * @param {unknown} resource
 * @returns {object}
 */
function serializeResourceTemporals(resource) {
    const { definition, definitions } = assertResourceObject(resource);
    const clone = _.cloneDeep(resource);
    walkNode(clone, definition, [/** @type {{ resourceType: string }} */ (clone).resourceType], definitions, "serialize");
    return clone;
}

/**
 * @param {unknown} lastUpdated
 * @returns {string}
 */
function toHttpLastModified(lastUpdated) {
    let scalar;
    if (typeof lastUpdated === "string") {
        scalar = lastUpdated;
    } else if (isPlainObject(lastUpdated) && typeof lastUpdated.value === "string") {
        scalar = lastUpdated.value;
    }

    const parsed = new Date(scalar);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toUTCString();
    }
    return parsed.toUTCString();
}

/**
 * @param {object} node
 * @param {object} definition
 * @param {string[]} pathSegments
 * @param {Record<string, object>} definitions
 * @param {'normalize' | 'serialize'} mode
 */
function walkNode(node, definition, pathSegments, definitions, mode) {
    if (node === undefined || node === null || typeof node !== "object" || Array.isArray(node)) {
        return;
    }

    if (isResourceListDefinition(definition)) {
        walkContainedResource(node, pathSegments, definitions, mode);
        return;
    }

    const properties = definition.properties;
    if (!properties) {
        return;
    }

    for (const key of Object.keys(node)) {
        if (key.startsWith("_")) {
            continue;
        }

        const schemaKey = key === "myCollection" && properties.collection ? "collection" : key;
        const propertySchema = properties[schemaKey];
        if (!propertySchema) {
            continue;
        }

        const child = node[key];
        if (child === undefined || child === null) {
            continue;
        }

        walkProperty(node, key, child, propertySchema, pathSegments.concat(key), definitions, mode);
    }
}

/**
 * @param {object} definition
 * @returns {boolean}
 */
function isResourceListDefinition(definition) {
    return Boolean(definition && Array.isArray(definition.oneOf));
}

/**
 * @param {object} parent
 * @param {string} key
 * @param {unknown} child
 * @param {object} propertySchema
 * @param {string[]} pathSegments
 * @param {Record<string, object>} definitions
 * @param {'normalize' | 'serialize'} mode
 */
function walkProperty(parent, key, child, propertySchema, pathSegments, definitions, mode) {
    if (propertySchema.type === "array") {
        if (!Array.isArray(child)) {
            return;
        }

        const itemSchema = propertySchema.items || {};
        for (let index = 0; index < child.length; index++) {
            const item = child[index];
            if (item === undefined || item === null) {
                continue;
            }

            applySchemaToValue(
                child,
                index,
                item,
                itemSchema,
                pathSegments.concat(String(index)),
                definitions,
                key,
                mode
            );
        }
        return;
    }

    applySchemaToValue(parent, key, child, propertySchema, pathSegments, definitions, key, mode);
}

/**
 * @param {object | unknown[]} parent
 * @param {string | number} key
 * @param {unknown} value
 * @param {object} schema
 * @param {string[]} pathSegments
 * @param {Record<string, object>} definitions
 * @param {string} fieldName
 * @param {'normalize' | 'serialize'} mode
 */
function applySchemaToValue(parent, key, value, schema, pathSegments, definitions, fieldName, mode) {
    const choice = fixChoiceTypeOfDate(fieldName, schema.type);
    if (choice.yes && TEMPORAL_TYPES.has(choice.type)) {
        parent[key] = applyLeaf(value, choice.type, pathSegments, mode);
        return;
    }

    const refName = definitionNameFromRef(schema.$ref);
    if (!refName) {
        return;
    }

    if (TEMPORAL_TYPES.has(refName)) {
        parent[key] = applyLeaf(value, refName, pathSegments, mode);
        return;
    }

    if (refName === "ResourceList") {
        walkContainedResource(value, pathSegments, definitions, mode);
        return;
    }

    const nestedDefinition = definitions[refName];
    if (!nestedDefinition) {
        return;
    }

    if (isResourceListDefinition(nestedDefinition)) {
        walkContainedResource(value, pathSegments, definitions, mode);
        return;
    }

    if (nestedDefinition.properties && typeof value === "object" && !Array.isArray(value)) {
        walkNode(value, nestedDefinition, pathSegments, definitions, mode);
    }
}

/**
 * @param {unknown} value
 * @param {'date' | 'dateTime' | 'instant'} type
 * @param {string[]} pathSegments
 * @param {'normalize' | 'serialize'} mode
 * @returns {unknown}
 */
function applyLeaf(value, type, pathSegments, mode) {
    if (mode === "serialize") {
        return serializeStoredTemporal(value, type);
    }

    return normalizeTemporalSafe(value, type, formatWalkPath(pathSegments));
}

/**
 * @param {unknown} value
 * @param {string[]} pathSegments
 * @param {Record<string, object>} definitions
 * @param {'normalize' | 'serialize'} mode
 */
function walkContainedResource(value, pathSegments, definitions, mode) {
    if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) {
        return;
    }

    const resourceType = /** @type {{ resourceType?: unknown }} */ (value).resourceType;
    if (typeof resourceType !== "string" || resourceType.length === 0) {
        return;
    }

    const definition = definitions[resourceType];
    if (!definition) {
        return;
    }

    walkNode(value, definition, pathSegments, definitions, mode);
}

module.exports = {
    normalizeResourceTemporals,
    serializeResourceTemporals,
    toHttpLastModified
};
