const { createDiagnostic } = require("../registry/diagnostics");
const { getLookupKey } = require("../registry/identity");
const {
    loadResourceTypeMap,
    resolvePathMetadata,
    resolvePathDatatype,
    resolvePathContextMap,
    expandChoiceElementNames,
    getComplexTypeFields
} = require("./resourceTypeMap");
const { hasSearchTypeProjection } = require("../executor/searchTypeProjection");
const {
    extractReferenceTargetType,
    hasDeceasedNotFalsePredicate,
    extractSystemPredicate,
    extractTypePredicate
} = require("./astValidator");
const { attachPathCorrelation } = require("./planMetadata");

const TEMPORAL_DATATYPES = new Set(["date", "dateTime", "instant", "Period"]);
const TEMPORAL_DATATYPE_PATHS = {
    Timing: ["event"]
};

/**
 * @typedef {Object} PathPredicate
 * @property {'systemEquals' | 'deceasedPresence' | 'typeEquals'} kind
 * @property {string} [value]
 */

/**
 * @typedef {Object} ExtractionPath
 * @property {string} path
 * @property {string} datatype
 * @property {string} [referenceTargetType]
 * @property {PathPredicate[]} [predicates]
 * @property {string[]} [arrayPaths]
 * @property {{ kind: 'same-array-element' | 'none', parentPath?: string, fields?: string[] }} [correlation]
 */

/**
 * @typedef {Object} RawPath
 * @property {string} rootType
 * @property {string[]} segments
 * @property {string} [referenceTargetType]
 * @property {PathPredicate[]} [predicates]
 */

/**
 * @param {string} baseName
 * @param {string} valueType
 * @returns {string}
 */
function toChoiceElementName(baseName, valueType) {
    if (!valueType) {
        return baseName;
    }
    return `${baseName}${valueType.charAt(0).toUpperCase()}${valueType.slice(1)}`;
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string} resourceType
 * @param {Object} resourceTypeMap
 * @returns {RawPath[]}
 */
function collectRawPaths(node, resourceType, resourceTypeMap) {
    switch (node.type) {
        case "Identifier":
            return [{ rootType: node.name || "", segments: [] }];
        case "PropertyAccess": {
            const parentPaths = collectRawPaths(node.left, resourceType, resourceTypeMap);
            return parentPaths.map((entry) => ({
                rootType: entry.rootType,
                segments: [...entry.segments, node.name || ""],
                referenceTargetType: entry.referenceTargetType,
                predicates: entry.predicates
            }));
        }
        case "Union":
            return [
                ...collectRawPaths(node.left, resourceType, resourceTypeMap),
                ...collectRawPaths(node.right, resourceType, resourceTypeMap)
            ];
        case "And":
            return [
                ...collectRawPaths(node.left, resourceType, resourceTypeMap),
                ...collectRawPaths(node.right, resourceType, resourceTypeMap)
            ];
        case "Comparison":
            return collectRawPaths(node.left, resourceType, resourceTypeMap);
        case "As":
        case "OfType": {
            const operandPaths = collectRawPaths(node.operand, resourceType, resourceTypeMap);
            const valueType = node.valueType || "";
            return operandPaths.map((entry) => {
                const segments = [...entry.segments];
                const last = segments.pop() || "";
                return {
                    rootType: entry.rootType,
                    segments: [...segments, toChoiceElementName(last, valueType)],
                    referenceTargetType: entry.referenceTargetType,
                    predicates: entry.predicates
                };
            });
        }
        case "Exists": {
            const operandPaths = collectRawPaths(node.operand, resourceType, resourceTypeMap);
            /** @type {RawPath[]} */
            const expanded = [];
            for (const entry of operandPaths) {
                const segments = [...entry.segments];
                const last = segments.pop() || "";
                const parentPath = segments.join(".");
                const parentResolved = parentPath
                    ? resolvePathDatatype(resourceTypeMap, parentPath)
                    : { found: true, datatype: null };
                const contextMap =
                    parentPath && parentResolved.found
                        ? resourceTypeMap
                        : resourceTypeMap;
                const choiceFields = expandChoiceElementNames(contextMap, last);
                if (choiceFields.length > 0) {
                    for (const field of choiceFields) {
                        expanded.push({
                            rootType: entry.rootType,
                            segments: [...segments, field],
                            referenceTargetType: entry.referenceTargetType,
                            predicates: entry.predicates
                        });
                    }
                } else {
                    expanded.push({
                        rootType: entry.rootType,
                        segments: [...segments, toChoiceElementName(last, "boolean")],
                        referenceTargetType: entry.referenceTargetType,
                        predicates: entry.predicates
                    });
                }
            }
            return expanded;
        }
        case "Where": {
            const operandPaths = collectRawPaths(node.operand, resourceType, resourceTypeMap);
            const referenceTargetType = extractReferenceTargetType(node);
            const systemPredicate = extractSystemPredicate(node);
            const typePredicate = extractTypePredicate(node);
            /** @type {PathPredicate[]} */
            const predicates = [];
            if (systemPredicate?.property === "system") {
                predicates.push({ kind: "systemEquals", value: systemPredicate.value });
            }
            if (typePredicate?.property === "type") {
                predicates.push({ kind: "typeEquals", value: typePredicate.value });
            }
            return operandPaths.map((entry) => ({
                rootType: entry.rootType,
                segments: entry.segments,
                referenceTargetType: referenceTargetType || entry.referenceTargetType,
                predicates: [...(entry.predicates || []), ...predicates]
            }));
        }
        case "ArrayIndex": {
            const operandPaths = collectRawPaths(node.operand, resourceType, resourceTypeMap);
            return operandPaths.map((entry) => ({
                rootType: entry.rootType,
                segments: [...entry.segments, String(node.index ?? 0)],
                referenceTargetType: entry.referenceTargetType,
                predicates: entry.predicates
            }));
        }
        default:
            return [];
    }
}

/**
 * @param {RawPath[]} rawPaths
 * @param {string} resourceType
 * @returns {RawPath[]}
 */
function filterPathsForResource(rawPaths, resourceType) {
    return rawPaths.filter(
        (entry) => entry.rootType === resourceType || entry.rootType === "Resource"
    );
}

/**
 * @param {RawPath[]} rawPaths
 * @param {string} resourceType
 * @param {Object} typeMap
 * @returns {RawPath[]}
 */
function normalizeBareFieldPaths(rawPaths, resourceType, typeMap) {
    /** @type {RawPath[]} */
    const normalized = [];
    for (const entry of rawPaths) {
        if (entry.rootType === resourceType || entry.rootType === "Resource") {
            normalized.push(entry);
            continue;
        }
        if (entry.segments.length === 0 && typeMap[entry.rootType]) {
            normalized.push({
                ...entry,
                rootType: resourceType,
                segments: [entry.rootType]
            });
        }
    }
    return normalized;
}

/**
 * @param {string} dotPath
 * @returns {string}
 */
function normalizePathForTypeResolution(dotPath) {
    return dotPath
        .split(".")
        .filter((segment) => !/^\d+$/.test(segment))
        .join(".");
}

/**
 * @param {Object} typeMap
 * @param {string} parentPath
 * @param {string} searchType
 * @returns {Object}
 */
function getContextMapForPath(typeMap, parentPath, searchType) {
    if (!parentPath) {
        return typeMap;
    }
    if (searchType === "date" || searchType === "dateTime") {
        const pathContext = resolvePathContextMap(typeMap, parentPath);
        if (pathContext) {
            return pathContext;
        }
    }
    const resolved = resolvePathDatatype(typeMap, parentPath);
    if (!resolved.found || !resolved.datatype) {
        return typeMap;
    }
    return getComplexTypeFields(resolved.datatype) || typeMap;
}

/**
 * @param {RawPath} rawPath
 * @param {Object} typeMap
 * @param {string} searchType
 * @returns {RawPath[]}
 */
function expandTerminalChoicePaths(rawPath, typeMap, searchType) {
    const path = rawPath.segments.join(".");
    const resolved = resolvePathDatatype(typeMap, path);
    if (resolved.found && resolved.datatype) {
        return [rawPath];
    }

    const segments = [...rawPath.segments];
    const last = segments.pop();
    if (!last) {
        return [];
    }

    const parentPath = segments.join(".");
    const contextMap = getContextMapForPath(typeMap, parentPath, searchType);
    const choiceFields = expandChoiceElementNames(contextMap, last);
    if (choiceFields.length === 0) {
        return [rawPath];
    }

    return choiceFields.map((field) => ({
        rootType: rawPath.rootType,
        segments: [...segments, field],
        referenceTargetType: rawPath.referenceTargetType,
        predicates: rawPath.predicates
    }));
}

/**
 * @param {RawPath[]} rawPaths
 * @param {Object} typeMap
 * @param {string} searchType
 * @returns {RawPath[]}
 */
function expandAllChoicePaths(rawPaths, typeMap, searchType) {
    /** @type {RawPath[]} */
    const expanded = [];
    for (const rawPath of rawPaths) {
        expanded.push(...expandTerminalChoicePaths(rawPath, typeMap, searchType));
    }
    return expanded;
}

function expandTemporalDatatypePaths(path, datatype, typeMap, searchType) {
    if (!["date", "dateTime"].includes(searchType)) {
        return [{ path, datatype }];
    }
    const nestedPaths = TEMPORAL_DATATYPE_PATHS[datatype];
    if (!nestedPaths) {
        return [{ path, datatype }];
    }

    return nestedPaths
        .map((nestedPath) => {
            const resolved = resolvePathMetadata(typeMap, `${path}.${nestedPath}`);
            if (!resolved.found || !resolved.datatype) {
                return null;
            }
            return {
                path: `${path}.${nestedPath}`,
                datatype: resolved.datatype,
                arrayPaths: resolved.arrayPaths
            };
        })
        .filter((entry) => entry !== null);
}

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {string} resourceType
 * @param {import('./parser/ast').AstNode | null} ast
 * @param {string} searchType
 * @returns {{ extractionPaths: ExtractionPath[], diagnostics: import('../registry/diagnostics').RegistryDiagnostic[] }}
 */
function compileExtractionPaths(definition, resourceType, ast, searchType) {
    const diagnostics = [];
    const lookupKey = getLookupKey(resourceType, definition.resource.code || "");
    const typeMap = loadResourceTypeMap(resourceType);

    if (!typeMap) {
        diagnostics.push(
            createDiagnostic({
                code: "missing-type-map",
                category: "compile",
                message: `Resource type map not found for ${resourceType}`,
                canonicalKey: definition.canonicalKey,
                lookupKey
            })
        );
        return { extractionPaths: [], diagnostics };
    }

    if (!ast) {
        const systemPaths = deriveSystemExtractionPaths(definition.resource, typeMap);
        return { extractionPaths: systemPaths, diagnostics };
    }

    const rawPaths = expandAllChoicePaths(
        filterPathsForResource(
            normalizeBareFieldPaths(collectRawPaths(ast, resourceType, typeMap), resourceType, typeMap),
            resourceType
        ),
        typeMap,
        searchType
    );
    /** @type {ExtractionPath[]} */
    const extractionPaths = [];
    const deceasedSemantics = hasDeceasedNotFalsePredicate(ast);

    for (const rawPath of rawPaths) {
        const path = rawPath.segments.join(".");
        if (!path) {
            continue;
        }

        const normalizedPath = normalizePathForTypeResolution(path);
        const resolved = resolvePathMetadata(typeMap, normalizedPath);
        if (!resolved.found || !resolved.datatype) {
            diagnostics.push(
                createDiagnostic({
                    code: "incompatible-branch",
                    category: "compile",
                    message: `Path ${path} is missing from ${resourceType} type map`,
                    canonicalKey: definition.canonicalKey,
                    lookupKey,
                    expression: definition.resource.expression
                })
            );
            continue;
        }

        /** @type {PathPredicate[]} */
        const predicates = [...(rawPath.predicates || [])];
        if (deceasedSemantics && path.startsWith("deceased")) {
            predicates.push({ kind: "deceasedPresence" });
        }

        const projectedPaths = expandTemporalDatatypePaths(
            path,
            resolved.datatype,
            typeMap,
            searchType
        );
        for (const projectedPath of projectedPaths) {
            if (!hasSearchTypeProjection(searchType, projectedPath.datatype)) {
                diagnostics.push(
                    createDiagnostic({
                        code: "incompatible-branch",
                        category: "compile",
                        message: `No search-type projection for ${searchType} on ${projectedPath.datatype} at ${projectedPath.path}`,
                        canonicalKey: definition.canonicalKey,
                        lookupKey,
                        expression: definition.resource.expression
                    })
                );
                continue;
            }

            const extractionPath = {
                path: projectedPath.path,
                datatype: projectedPath.datatype,
                ...(rawPath.referenceTargetType
                    ? { referenceTargetType: rawPath.referenceTargetType }
                    : {}),
                ...(predicates.length > 0 ? { predicates } : {})
            };
            const arrayPaths = projectedPath.arrayPaths || resolved.arrayPaths;
            if (
                TEMPORAL_DATATYPES.has(projectedPath.datatype) &&
                !projectedPath.path.split(".").some((segment) => /^\d+$/.test(segment)) &&
                arrayPaths.length > 0
            ) {
                extractionPath.arrayPaths = arrayPaths;
            }
            extractionPaths.push(attachPathCorrelation(extractionPath));
        }
    }

    return { extractionPaths: dedupeExtractionPaths(extractionPaths), diagnostics };
}

/**
 * And of exists() and a comparison on the same choice field would otherwise
 * emit the same typed path twice.
 * @param {ExtractionPath[]} extractionPaths
 * @returns {ExtractionPath[]}
 */
function dedupeExtractionPaths(extractionPaths) {
    const seen = new Set();
    /** @type {ExtractionPath[]} */
    const unique = [];
    for (const entry of extractionPaths) {
        const key = JSON.stringify({
            path: entry.path,
            datatype: entry.datatype,
            referenceTargetType: entry.referenceTargetType || "",
            predicates: entry.predicates || [],
            arrayPaths: entry.arrayPaths || []
        });
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        unique.push(entry);
    }
    return unique;
}

/**
 * @param {import('../registry/types').SearchParameterResource} resource
 * @param {Object} typeMap
 * @returns {ExtractionPath[]}
 */
function deriveSystemExtractionPaths(resource, typeMap) {
    if (resource.code === "_id") {
        return [{ path: "id", datatype: "string" }];
    }
    if (resource.code === "_lastUpdated") {
        const resolved = resolvePathDatatype(typeMap, "meta.lastUpdated");
        return [
            {
                path: "meta.lastUpdated",
                datatype: resolved.datatype || "instant"
            }
        ];
    }
    return [];
}

module.exports = {
    toChoiceElementName,
    collectRawPaths,
    filterPathsForResource,
    normalizeBareFieldPaths,
    normalizePathForTypeResolution,
    expandTerminalChoicePaths,
    expandAllChoicePaths,
    compileExtractionPaths,
    deriveSystemExtractionPaths
};
