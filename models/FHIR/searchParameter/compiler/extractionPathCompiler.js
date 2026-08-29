const { createDiagnostic } = require("../registry/diagnostics");
const { getLookupKey } = require("../registry/identity");
const {
    loadResourceTypeMap,
    resolvePathDatatype,
    expandChoiceElementNames
} = require("./resourceTypeMap");
const { hasSearchTypeProjection } = require("../executor/searchTypeProjection");
const {
    extractReferenceTargetType,
    hasDeceasedNotFalsePredicate,
    extractSystemPredicate
} = require("./astValidator");

/**
 * @typedef {Object} PathPredicate
 * @property {'systemEquals' | 'deceasedPresence'} kind
 * @property {string} [value]
 */

/**
 * @typedef {Object} ExtractionPath
 * @property {string} path
 * @property {string} datatype
 * @property {string} [referenceTargetType]
 * @property {PathPredicate[]} [predicates]
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
            /** @type {PathPredicate[]} */
            const predicates = [];
            if (systemPredicate?.property === "system") {
                predicates.push({ kind: "systemEquals", value: systemPredicate.value });
            }
            return operandPaths.map((entry) => ({
                rootType: entry.rootType,
                segments: entry.segments,
                referenceTargetType: referenceTargetType || entry.referenceTargetType,
                predicates: [...(entry.predicates || []), ...predicates]
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

    const rawPaths = filterPathsForResource(
        collectRawPaths(ast, resourceType, typeMap),
        resourceType
    );
    /** @type {ExtractionPath[]} */
    const extractionPaths = [];
    const deceasedSemantics = hasDeceasedNotFalsePredicate(ast);

    for (const rawPath of rawPaths) {
        const path = rawPath.segments.join(".");
        if (!path) {
            continue;
        }

        const resolved = resolvePathDatatype(typeMap, path);
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

        if (!hasSearchTypeProjection(searchType, resolved.datatype)) {
            diagnostics.push(
                createDiagnostic({
                    code: "incompatible-branch",
                    category: "compile",
                    message: `No search-type projection for ${searchType} on ${resolved.datatype} at ${path}`,
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

        extractionPaths.push({
            path,
            datatype: resolved.datatype,
            ...(rawPath.referenceTargetType
                ? { referenceTargetType: rawPath.referenceTargetType }
                : {}),
            ...(predicates.length > 0 ? { predicates } : {})
        });
    }

    return { extractionPaths, diagnostics };
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
    compileExtractionPaths,
    deriveSystemExtractionPaths
};
