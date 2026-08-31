const fs = require("fs");
const path = require("path");

const TYPE_MAP_ROOT = path.join(
    __dirname,
    "../../../../api_generator/to-code-use-definition"
);
const FHIR_SCHEMA_PATH = path.join(
    __dirname,
    "../../../../FHIR-mongoose-Models-Generator/fhir.schema.json"
);

/** @type {Map<string, Object | null>} */
const cache = new Map();
let fhirSchemaDefinitions;

const PRIMITIVE_TYPES = new Set([
    "string",
    "boolean",
    "integer",
    "decimal",
    "uri",
    "url",
    "canonical",
    "code",
    "id",
    "oid",
    "uuid",
    "date",
    "dateTime",
    "instant",
    "time",
    "markdown",
    "base64Binary",
    "unsignedInt",
    "positiveInt"
]);
const GENERATED_COMPLEX_TYPE_FIELDS = new Set(["Dosage", "Timing"]);

/**
 * FHIR complex datatype field maps used for recursive path resolution.
 * @type {Record<string, Record<string, string>>}
 */
const COMPLEX_TYPE_FIELDS = {
    Address: {
        use: "code",
        type: "code",
        text: "string",
        line: "string",
        city: "string",
        district: "string",
        state: "string",
        postalCode: "string",
        country: "string",
        period: "Period"
    },
    HumanName: {
        use: "code",
        text: "string",
        family: "string",
        given: "string",
        prefix: "string",
        suffix: "string",
        period: "Period"
    },
    ContactPoint: {
        system: "code",
        value: "string",
        use: "code",
        rank: "positiveInt",
        period: "Period"
    },
    Identifier: {
        use: "code",
        type: "CodeableConcept",
        system: "uri",
        value: "string",
        period: "Period",
        assigner: "Reference"
    },
    Coding: {
        system: "uri",
        version: "string",
        code: "code",
        display: "string",
        userSelected: "boolean"
    },
    CodeableConcept: {
        coding: "Coding",
        text: "string"
    },
    Reference: {
        reference: "string",
        type: "uri",
        identifier: "Identifier",
        display: "string"
    },
    Period: {
        start: "dateTime",
        end: "dateTime"
    },
    Quantity: {
        value: "decimal",
        comparator: "code",
        unit: "string",
        system: "uri",
        code: "code"
    },
    Age: {
        value: "decimal",
        unit: "string",
        system: "uri",
        code: "code"
    },
    UsageContext: {
        code: "Coding",
        valueCodeableConcept: "CodeableConcept",
        valueQuantity: "Quantity",
        valueRange: "Range",
        valueReference: "Reference"
    },
    RelatedArtifact: {
        type: "code",
        label: "string",
        display: "string",
        citation: "markdown",
        url: "url",
        document: "Attachment",
        resource: "canonical"
    },
    Attachment: {
        contentType: "code",
        language: "code",
        data: "base64Binary",
        url: "url",
        size: "unsignedInt",
        title: "string"
    },
    Money: {
        value: "decimal",
        currency: "code"
    },
    Duration: {
        value: "decimal",
        unit: "code",
        system: "uri",
        code: "code"
    },
    ContactDetail: {
        name: "string",
        telecom: "ContactPoint"
    },
    Annotation: {
        authorString: "string",
        authorReference: "Reference",
        time: "dateTime",
        text: "markdown"
    }
};

/**
 * @param {string} resourceType
 * @returns {Object | null}
 */
function loadResourceTypeMap(resourceType) {
    if (cache.has(resourceType)) {
        return cache.get(resourceType) || null;
    }
    const filePath = path.join(TYPE_MAP_ROOT, `${resourceType}.json`);
    if (!fs.existsSync(filePath)) {
        cache.set(resourceType, null);
        return null;
    }
    const typeMap = JSON.parse(fs.readFileSync(filePath, "utf8"));
    cache.set(resourceType, typeMap);
    return typeMap;
}

/**
 * @param {Object} node
 * @returns {string | null}
 */
function readNodeDatatype(node) {
    if (!node || typeof node !== "object") {
        return null;
    }
    if (typeof node.type === "string") {
        return node.type;
    }
    return null;
}

/**
 * @param {string} datatype
 * @returns {Record<string, string> | null}
 */
function getComplexTypeFields(datatype) {
    if (!datatype || PRIMITIVE_TYPES.has(datatype)) {
        return null;
    }
    if (COMPLEX_TYPE_FIELDS[datatype]) {
        return COMPLEX_TYPE_FIELDS[datatype];
    }

    if (!GENERATED_COMPLEX_TYPE_FIELDS.has(datatype)) {
        return null;
    }
    const fields = getGeneratedComplexTypeFields(datatype);
    return fields && Object.keys(fields).length > 0 ? fields : null;
}

function loadFhirSchemaDefinitions() {
    if (fhirSchemaDefinitions !== undefined) {
        return fhirSchemaDefinitions;
    }
    if (!fs.existsSync(FHIR_SCHEMA_PATH)) {
        fhirSchemaDefinitions = null;
        return fhirSchemaDefinitions;
    }
    const schema = JSON.parse(fs.readFileSync(FHIR_SCHEMA_PATH, "utf8"));
    fhirSchemaDefinitions = schema.definitions || null;
    return fhirSchemaDefinitions;
}

function getDefinitionName(ref) {
    if (typeof ref !== "string") {
        return null;
    }
    const match = ref.match(/^#\/definitions\/(.+)$/);
    return match ? match[1] : null;
}

function getGeneratedComplexTypeField(datatype, segment) {
    const definitions = loadFhirSchemaDefinitions();
    const definition = definitions?.[datatype];
    const property = definition?.properties?.[segment];
    if (!property) {
        return null;
    }

    const propertySchema = property.type === "array" ? property.items : property;
    const propertyDatatype =
        getDefinitionName(propertySchema?.$ref) ||
        (typeof propertySchema?.type === "string" &&
        propertySchema.type !== "array" &&
        propertySchema.type !== "object"
            ? propertySchema.type
            : null);
    if (!propertyDatatype) {
        return null;
    }
    return {
        datatype: propertyDatatype,
        isArray: property.type === "array"
    };
}

function getComplexTypeField(datatype, segment) {
    const manualDatatype = COMPLEX_TYPE_FIELDS[datatype]?.[segment];
    if (manualDatatype) {
        return { datatype: manualDatatype, isArray: false };
    }
    if (!GENERATED_COMPLEX_TYPE_FIELDS.has(datatype)) {
        return null;
    }
    return getGeneratedComplexTypeField(datatype, segment);
}

function getGeneratedComplexTypeFields(datatype) {
    const definitions = loadFhirSchemaDefinitions();
    const properties = definitions?.[datatype]?.properties;
    if (!properties) {
        return null;
    }
    return Object.fromEntries(
        Object.keys(properties)
            .filter((segment) => !segment.startsWith("_"))
            .map((segment) => [segment, getComplexTypeField(datatype, segment)?.datatype])
            .filter(([, fieldDatatype]) => fieldDatatype)
    );
}

/**
 * @param {Object} typeMap
 * @param {string} segment
 * @returns {{ node: Object | null, datatype: string | null }}
 */
function resolveSegmentNode(typeMap, segment) {
    const field = typeMap[segment];
    if (!field || typeof field !== "object") {
        return { node: null, datatype: null };
    }
    return { node: field, datatype: readNodeDatatype(field) };
}

function resolvePathContextMap(typeMap, dotPath) {
    const segments = dotPath.split(".").filter(Boolean);
    if (segments.length === 0) {
        return typeMap;
    }

    let current = typeMap;
    let currentDatatype = null;
    for (const segment of segments) {
        const { node, datatype } = resolveSegmentNode(current, segment);
        if (node) {
            currentDatatype = datatype;
            current = node;
            continue;
        }

        const complexField = getComplexTypeField(currentDatatype, segment);
        if (!complexField) {
            return null;
        }
        currentDatatype = complexField.datatype;
        current = getComplexTypeFields(currentDatatype) || {};
    }
    return current;
}

/**
 * @param {Object} typeMap
 * @param {string} dotPath
 * @returns {{ datatype: string | null, found: boolean, arrayPaths: string[] }}
 */
function resolvePathMetadata(typeMap, dotPath) {
    const segments = dotPath.split(".").filter(Boolean);
    if (segments.length === 0) {
        return { datatype: null, found: false, arrayPaths: [] };
    }

    let current = typeMap;
    let currentDatatype = null;
    const arrayPaths = [];

    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const { node, datatype } = resolveSegmentNode(current, segment);
        if (!node) {
            const complexField = getComplexTypeField(currentDatatype, segment);
            if (complexField) {
                if (complexField.isArray) {
                    arrayPaths.push(segments.slice(0, index + 1).join("."));
                }
                currentDatatype = complexField.datatype;
                if (index === segments.length - 1) {
                    return { datatype: currentDatatype, found: true, arrayPaths };
                }
                const nestedFields = getComplexTypeFields(currentDatatype);
                if (!nestedFields) {
                    return { datatype: currentDatatype, found: true, arrayPaths };
                }
                current = nestedFields;
                continue;
            }
            return { datatype: null, found: false, arrayPaths: [] };
        }

        if (node.isArray === true) {
            arrayPaths.push(segments.slice(0, index + 1).join("."));
        }
        currentDatatype = datatype;
        if (index === segments.length - 1) {
            return { datatype: currentDatatype, found: true, arrayPaths };
        }

        if (node[segments[index + 1]] !== undefined) {
            current = node;
            continue;
        }

        if (getComplexTypeFields(currentDatatype)) {
            current = getComplexTypeFields(currentDatatype);
            continue;
        }

        return { datatype: null, found: false, arrayPaths: [] };
    }

    return { datatype: null, found: false, arrayPaths: [] };
}

/**
 * @param {Object} typeMap
 * @param {string} dotPath
 * @returns {{ datatype: string | null, found: boolean }}
 */
function resolvePathDatatype(typeMap, dotPath) {
    const { datatype, found } = resolvePathMetadata(typeMap, dotPath);
    return { datatype, found };
}

/**
 * @param {Object} typeMap
 * @param {string} choiceBaseName
 * @returns {string[]}
 */
function expandChoiceElementNames(typeMap, choiceBaseName) {
    const prefix =
        choiceBaseName.charAt(0).toUpperCase() + choiceBaseName.slice(1);
    return Object.keys(typeMap).filter((key) => {
        if (!key.startsWith(choiceBaseName) || key.length <= choiceBaseName.length) {
            return false;
        }
        const suffix = key.slice(choiceBaseName.length);
        return suffix.charAt(0) === suffix.charAt(0).toUpperCase();
    });
}

function clearResourceTypeMapCache() {
    cache.clear();
}

module.exports = {
    TYPE_MAP_ROOT,
    COMPLEX_TYPE_FIELDS,
    PRIMITIVE_TYPES,
    loadResourceTypeMap,
    getComplexTypeFields,
    getComplexTypeField,
    resolvePathContextMap,
    resolvePathMetadata,
    resolvePathDatatype,
    expandChoiceElementNames,
    clearResourceTypeMapCache
};
