const { parseFhirPath } = require("./parserAdapter");
const { validateAst } = require("./astValidator");
const { isSupportedSearchType } = require("./capabilityMatrix");
const { createSearchQueryPlan } = require("./searchQueryPlan");
const { createDiagnostic } = require("../registry/diagnostics");
const { getBaseResourceTypes, getLookupKey } = require("../registry/identity");
const { compileExtractionPaths } = require("./extractionPathCompiler");

/**
 * @typedef {Object} LookupCompileResult
 * @property {boolean} compilable
 * @property {string} [reason]
 * @property {import('./searchQueryPlan').SearchQueryPlan} [plan]
 */

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @returns {{ compilable: boolean, reason?: string, lookupPlans: Record<string, LookupCompileResult>, diagnostics: import('../registry/diagnostics').RegistryDiagnostic[] }}
 */
function compileDefinition(definition) {
    const resource = definition.resource;
    const diagnostics = [];
    const searchType = resource.type || "";

    if (!isSupportedSearchType(searchType)) {
        return {
            compilable: false,
            reason: `Unsupported search type: ${searchType}`,
            lookupPlans: {},
            diagnostics: [
                createDiagnostic({
                    code: "unsupported-type",
                    category: "compile",
                    message: `Unsupported search type: ${searchType}`,
                    canonicalKey: definition.canonicalKey
                })
            ]
        };
    }

    const expression = resource.expression;
    const resourceTypes = getBaseResourceTypes(resource);
    /** @type {Record<string, LookupCompileResult>} */
    const lookupPlans = {};
    let anyCompilable = false;

    if (!expression) {
        for (const resourceType of resourceTypes) {
            const lookupKey = getLookupKey(resourceType, resource.code || "");
            const { extractionPaths, diagnostics: pathDiagnostics } = compileExtractionPaths(
                definition,
                resourceType,
                null,
                searchType
            );
            diagnostics.push(...pathDiagnostics);
            const lookupResult = buildLookupResult(
                definition,
                resourceType,
                null,
                extractionPaths,
                searchType
            );
            lookupPlans[lookupKey] = lookupResult;
            if (lookupResult.compilable) {
                anyCompilable = true;
            }
        }

        if (!anyCompilable) {
            return {
                compilable: false,
                reason: "Missing expression",
                lookupPlans,
                diagnostics: [
                    ...diagnostics,
                    createDiagnostic({
                        code: "missing-expression",
                        category: "compile",
                        message: "SearchParameter expression is required",
                        canonicalKey: definition.canonicalKey
                    })
                ]
            };
        }

        return { compilable: true, lookupPlans, diagnostics };
    }

    const parsed = parseFhirPath(expression);
    if (!parsed.success || !parsed.ast) {
        return {
            compilable: false,
            reason: parsed.error || "Failed to parse expression",
            lookupPlans: {},
            diagnostics: [
                createDiagnostic({
                    code: "parse-failed",
                    category: "compile",
                    message: parsed.error || "Failed to parse expression",
                    canonicalKey: definition.canonicalKey,
                    expression
                })
            ]
        };
    }

    const validation = validateAst(parsed.ast);
    if (!validation.valid) {
        return {
            compilable: false,
            reason: validation.errors.join("; "),
            lookupPlans: {},
            diagnostics: validation.errors.map((message) =>
                createDiagnostic({
                    code: "validation-failed",
                    category: "compile",
                    message,
                    canonicalKey: definition.canonicalKey,
                    expression
                })
            )
        };
    }

    for (const resourceType of resourceTypes) {
        const lookupKey = getLookupKey(resourceType, resource.code || "");
        const { extractionPaths, diagnostics: pathDiagnostics } = compileExtractionPaths(
            definition,
            resourceType,
            parsed.ast,
            searchType
        );
        diagnostics.push(...pathDiagnostics);
        const lookupResult = buildLookupResult(
            definition,
            resourceType,
            parsed.ast,
            extractionPaths,
            searchType
        );
        lookupPlans[lookupKey] = lookupResult;
        if (lookupResult.compilable) {
            anyCompilable = true;
        } else if (lookupResult.reason) {
            diagnostics.push(
                createDiagnostic({
                    code: "lookup-disabled",
                    category: "compile",
                    message: lookupResult.reason,
                    canonicalKey: definition.canonicalKey,
                    lookupKey,
                    expression
                })
            );
        }
    }

    if (!anyCompilable) {
        return {
            compilable: false,
            reason: "No executable extraction paths for any lookup",
            lookupPlans,
            diagnostics
        };
    }

    return {
        compilable: true,
        lookupPlans,
        diagnostics
    };
}

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {string} resourceType
 * @param {import('./parser/ast').AstNode | null} ast
 * @param {import('./extractionPathCompiler').ExtractionPath[]} extractionPaths
 * @param {string} searchType
 * @returns {LookupCompileResult}
 */
function buildLookupResult(definition, resourceType, ast, extractionPaths, searchType) {
    if (extractionPaths.length === 0) {
        return {
            compilable: false,
            reason: `No executable extraction paths for ${resourceType}`
        };
    }

    const resource = definition.resource;
    const estimatedCost = extractionPaths.some((entry) => entry.path.includes(".")) ? 2 : 1;

    return {
        compilable: true,
        plan: createSearchQueryPlan({
            canonicalKey: definition.canonicalKey,
            resourceType,
            code: resource.code || "",
            searchType,
            kind: searchType === "reference" && resource.chain?.length ? "relation" : "filter",
            extractionPaths,
            ast,
            multipleOr: Boolean(resource.multipleOr),
            multipleAnd: Boolean(resource.multipleAnd),
            comparators: resource.comparator || [],
            modifiers: resource.modifier || [],
            chain: resource.chain,
            target: resource.target,
            depth: resource.chain?.length ? 1 : 0,
            estimatedCost,
            requiredIndexes: extractionPaths.map((entry) => entry.path.split(".")[0]),
            diagnostics: []
        })
    };
}

module.exports = {
    compileDefinition
};
