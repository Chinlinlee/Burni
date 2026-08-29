const fs = require("fs");
const path = require("path");

const TYPE_MAP_ROOT = path.join(
    __dirname,
    "../../../../api_generator/to-code-use-definition"
);

/** @type {Map<string, Object | null>} */
const cache = new Map();

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
    Attachment: {
        contentType: "code",
        language: "code",
        data: "base64Binary",
        url: "url",
        size: "unsignedInt",
        title: "string"
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
    return COMPLEX_TYPE_FIELDS[datatype] || null;
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

/**
 * @param {Object} typeMap
 * @param {string} dotPath
 * @returns {{ datatype: string | null, found: boolean }}
 */
function resolvePathDatatype(typeMap, dotPath) {
    const segments = dotPath.split(".").filter(Boolean);
    if (segments.length === 0) {
        return { datatype: null, found: false };
    }

    let current = typeMap;
    let currentDatatype = null;

    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const { node, datatype } = resolveSegmentNode(current, segment);
        if (!node) {
            const complexFields = getComplexTypeFields(currentDatatype);
            if (complexFields && complexFields[segment]) {
                currentDatatype = complexFields[segment];
                if (index === segments.length - 1) {
                    return { datatype: currentDatatype, found: true };
                }
                const nestedFields = getComplexTypeFields(currentDatatype);
                if (!nestedFields) {
                    return { datatype: currentDatatype, found: true };
                }
                current = nestedFields;
                continue;
            }
            return { datatype: null, found: false };
        }

        currentDatatype = datatype;
        if (index === segments.length - 1) {
            return { datatype: currentDatatype, found: true };
        }

        if (node[segments[index + 1]] !== undefined) {
            current = node;
            continue;
        }

        const complexFields = getComplexTypeFields(currentDatatype);
        if (complexFields) {
            current = complexFields;
            continue;
        }

        return { datatype: null, found: false };
    }

    return { datatype: null, found: false };
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
    loadResourceTypeMap,
    resolvePathDatatype,
    expandChoiceElementNames,
    clearResourceTypeMapCache
};
