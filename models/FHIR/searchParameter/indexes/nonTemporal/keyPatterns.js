"use strict";

const { hasSearchTypeProjection } = require("../../executor/searchTypeProjection");
const {
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS,
    NON_TEMPORAL_POLICY_VERSION
} = require("./constants");
const { createDiagnostic } = require("./diagnostics");
const { validateCompoundArrayCorrelation } = require("./arrayCorrelation");

/**
 * @param {Record<string, number>} key
 * @returns {string[]}
 */
function getIndexedFields(key) {
    return Object.keys(key).sort();
}

/**
 * @param {string} path
 * @param {string} datatype
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildTokenKeyPatterns(path, datatype, predicates) {
    const systemPredicate = predicates?.find((entry) => entry.kind === "systemEquals");
    const hasSystemPredicate = Boolean(systemPredicate?.value);

    if (datatype === "CodeableConcept") {
        const patterns = [];
        if (hasSystemPredicate) {
            patterns.push({
                keyPattern: "token-system-code",
                key: {
                    [`${path}.coding.system`]: 1,
                    [`${path}.coding.code`]: 1
                },
                fields: [`${path}.coding.system`, `${path}.coding.code`]
            });
        } else {
            patterns.push({
                keyPattern: "token-code-only",
                key: { [`${path}.coding.code`]: 1 },
                fields: [`${path}.coding.code`]
            });
            patterns.push({
                keyPattern: "token-system-code",
                key: {
                    [`${path}.coding.system`]: 1,
                    [`${path}.coding.code`]: 1
                },
                fields: [`${path}.coding.system`, `${path}.coding.code`]
            });
        }
        return patterns;
    }

    if (datatype === "Coding") {
        if (hasSystemPredicate) {
            return [
                {
                    keyPattern: "token-system-code",
                    key: {
                        [`${path}.system`]: 1,
                        [`${path}.code`]: 1
                    },
                    fields: [`${path}.system`, `${path}.code`]
                }
            ];
        }
        return [
            {
                keyPattern: "token-code-only",
                key: { [`${path}.code`]: 1 },
                fields: [`${path}.code`]
            },
            {
                keyPattern: "token-system-code",
                key: {
                    [`${path}.system`]: 1,
                    [`${path}.code`]: 1
                },
                fields: [`${path}.system`, `${path}.code`]
            }
        ];
    }

    if (datatype === "Identifier" || datatype === "ContactPoint") {
        if (hasSystemPredicate) {
            return [
                {
                    keyPattern: "token-system-value",
                    key: {
                        [`${path}.system`]: 1,
                        [`${path}.value`]: 1
                    },
                    fields: [`${path}.system`, `${path}.value`]
                }
            ];
        }
        return [
            {
                keyPattern: "token-value-only",
                key: { [`${path}.value`]: 1 },
                fields: [`${path}.value`]
            },
            {
                keyPattern: "token-system-value",
                key: {
                    [`${path}.system`]: 1,
                    [`${path}.value`]: 1
                },
                fields: [`${path}.system`, `${path}.value`]
            }
        ];
    }

    return [
        {
            keyPattern: "token-single-field",
            key: { [path]: 1 },
            fields: [path]
        }
    ];
}

/**
 * @param {string} path
 * @param {string} datatype
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildReferenceKeyPatterns(path, datatype) {
    if (datatype === "Reference" || datatype === "Resource") {
        const referenceField = datatype === "Resource" ? `${path}.reference` : `${path}.reference`;
        return [
            {
                keyPattern: "reference-stored-reference",
                key: { [referenceField]: 1 },
                fields: [referenceField]
            }
        ];
    }

    return [
        {
            keyPattern: "reference-raw-field",
            key: { [path]: 1 },
            fields: [path]
        }
    ];
}

/**
 * @param {string} path
 * @param {string} datatype
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildStringKeyPatterns(path, datatype) {
    if (datatype === "Address") {
        return ADDRESS_STRING_FIELDS.map((leaf) => ({
            keyPattern: "string-exact-leaf",
            key: { [`${path}.${leaf}`]: 1 },
            fields: [`${path}.${leaf}`]
        }));
    }
    if (datatype === "HumanName") {
        return HUMAN_NAME_STRING_FIELDS.map((leaf) => ({
            keyPattern: "string-exact-leaf",
            key: { [`${path}.${leaf}`]: 1 },
            fields: [`${path}.${leaf}`]
        }));
    }

    return [
        {
            keyPattern: "string-exact-leaf",
            key: { [path]: 1 },
            fields: [path]
        }
    ];
}

/**
 * @param {string} path
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildNumberKeyPatterns(path) {
    return [
        {
            keyPattern: "number-single-field",
            key: { [path]: 1 },
            fields: [path]
        }
    ];
}

/**
 * @param {string} path
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildQuantityKeyPatterns(path) {
    return [
        {
            keyPattern: "quantity-value-only",
            key: { [`${path}.value`]: 1 },
            fields: [`${path}.value`]
        },
        {
            keyPattern: "quantity-system-code-value",
            key: {
                [`${path}.system`]: 1,
                [`${path}.code`]: 1,
                [`${path}.value`]: 1
            },
            fields: [`${path}.system`, `${path}.code`, `${path}.value`]
        }
    ];
}

/**
 * @param {string} path
 * @returns {import('./types').ApprovedKeyPattern[]}
 */
function buildUriKeyPatterns(path) {
    return [
        {
            keyPattern: "uri-raw-single-field",
            key: { [path]: 1 },
            fields: [path]
        }
    ];
}

/**
 * @param {import('./types').PolicyEvaluationContext} context
 * @returns {import('./types').PolicyEvaluationResult}
 */
function evaluateKeyPatterns(context) {
    const { plan, extractionPath, lookupKey, definition, choicePaths = [] } = context;
    const path = extractionPath.path;
    const datatype = extractionPath.datatype;
    const searchType = plan.searchType;
    const arrayPaths = extractionPath.arrayPaths || [];

    if (!hasSearchTypeProjection(searchType, datatype)) {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "unsupported-projection-shape",
                    `No ${searchType} projection for ${datatype}`,
                    { lookupKey, path, searchType, datatype }
                )
            ]
        };
    }

    if (searchType === "token" && extractionPath.predicates?.some((entry) => entry.kind === "deceasedPresence")) {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "unsupported-token-shape",
                    "Deceased token predicate cannot be represented by a derived B-tree index",
                    { lookupKey, path }
                )
            ]
        };
    }

    /** @type {import('./types').ApprovedKeyPattern[]} */
    let patterns = [];
    switch (searchType) {
        case "token":
            patterns = buildTokenKeyPatterns(path, datatype, extractionPath.predicates);
            break;
        case "reference":
            patterns = buildReferenceKeyPatterns(path, datatype);
            break;
        case "string":
            patterns = buildStringKeyPatterns(path, datatype);
            break;
        case "number":
            patterns = buildNumberKeyPatterns(path);
            break;
        case "quantity":
            patterns = buildQuantityKeyPatterns(path);
            break;
        case "uri":
            patterns = buildUriKeyPatterns(path);
            break;
        default:
            return {
                approved: false,
                diagnostics: [
                    createDiagnostic(
                        "unsupported-search-type",
                        `Search type ${searchType} is outside non-temporal derived index policy`,
                        { lookupKey, path, searchType }
                    )
                ]
            };
    }

    /** @type {import('./types').IndexPolicyDiagnostic[]} */
    const diagnostics = [];
    /** @type {import('./types').ApprovedIndexSpec[]} */
    const approvedSpecs = [];

    for (const pattern of patterns) {
        const correlation = validateCompoundArrayCorrelation(pattern.fields, arrayPaths, path);
        if (!correlation.valid) {
            diagnostics.push(...correlation.diagnostics);
            continue;
        }

        approvedSpecs.push({
            resourceType: plan.resourceType,
            extractionPath: path,
            datatype,
            searchType,
            keyPattern: pattern.keyPattern,
            key: pattern.key,
            fields: pattern.fields,
            options: { background: true },
            policyVersion: NON_TEMPORAL_POLICY_VERSION,
            compatibility: {
                arrayPaths: correlation.arrayPaths,
                requiresElementCorrelation: (correlation.arrayPaths || []).length > 0,
                indexedModes:
                    searchType === "string"
                        ? ["exact"]
                        : searchType === "uri"
                          ? ["exact", "above", "below"]
                          : searchType === "number" || searchType === "quantity"
                            ? ["eq", "ne", "gt", "lt", "ge", "le"]
                            : ["default"],
                unsupportedModes:
                    searchType === "string"
                        ? ["contains", "default-prefix"]
                        : searchType === "token"
                          ? ["text"]
                          : searchType === "number" || searchType === "quantity"
                            ? ["sa", "eb", "ap"]
                            : [],
                ...(choicePaths.length > 1
                    ? {
                          choice: {
                              kind: "alternative-branches",
                              paths: [...choicePaths].sort(),
                              compound: false
                          }
                      }
                    : {})
            },
            provenance: {
                lookupKeys: [lookupKey],
                canonicalKeys: [definition.canonicalKey],
                codes: [definition.resource?.code || plan.code || ""]
            }
        });
    }

    if (approvedSpecs.length === 0) {
        return {
            approved: false,
            diagnostics
        };
    }

    return {
        approved: true,
        specs: approvedSpecs,
        diagnostics
    };
}

module.exports = {
    getIndexedFields,
    buildTokenKeyPatterns,
    buildReferenceKeyPatterns,
    buildStringKeyPatterns,
    buildNumberKeyPatterns,
    buildQuantityKeyPatterns,
    buildUriKeyPatterns,
    evaluateKeyPatterns
};
