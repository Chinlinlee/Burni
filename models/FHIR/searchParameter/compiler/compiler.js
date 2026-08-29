const { parseFhirPath } = require("./parserAdapter");
const { validateAst } = require("./astValidator");
const { isSupportedSearchType } = require("./capabilityMatrix");
const { createSearchQueryPlan } = require("./searchQueryPlan");
const { createDiagnostic } = require("../registry/diagnostics");
const { getBaseResourceTypes, getLookupKey } = require("../registry/identity");
const { compileExtractionPaths } = require("./extractionPathCompiler");
const { attachPlanMetadata } = require("./planMetadata");

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

    const expression = resource.expression;
    const resourceTypes = getBaseResourceTypes(resource);

    if (!isSupportedSearchType(searchType)) {
        const reason = `Unsupported search type: ${searchType}`;
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: [
                createDiagnostic({
                    code: "unsupported-type",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey
                })
            ]
        };
    }
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
        const reason = parsed.error || "Failed to parse expression";
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: [
                createDiagnostic({
                    code: "parse-failed",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey,
                    expression
                })
            ]
        };
    }

    const validation = validateAst(parsed.ast);
    if (!validation.valid) {
        const reason = `Unsupported expression feature: ${validation.errors.join("; ")}`;
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: validation.errors.map((message) =>
                createDiagnostic({
                    code: "unsupported-syntax",
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
    const metadata = attachPlanMetadata(resource, extractionPaths, searchType);
    const estimatedCost = metadata.extractionPaths.some((entry) => entry.path.includes("."))
        ? 2
        : 1;

    return {
        compilable: true,
        plan: createSearchQueryPlan({
            canonicalKey: definition.canonicalKey,
            resourceType,
            code: resource.code || "",
            searchType,
            kind: "filter",
            extractionPaths: metadata.extractionPaths,
            ast,
            multipleOr: resource.multipleOr !== false,
            multipleAnd: resource.multipleAnd !== false,
            comparators: resource.comparator || [],
            modifiers: resource.modifier || [],
            chain: resource.chain,
            target: resource.target,
            targets: metadata.targets,
            supportedValueForms: metadata.supportedValueForms,
            depth: resource.chain?.length ? 1 : 0,
            estimatedCost,
            requiredIndexes: metadata.extractionPaths.map((entry) => entry.path.split(".")[0]),
            diagnostics: []
        })
    };
}

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {string[]} resourceTypes
 * @param {string} reason
 * @returns {Record<string, LookupCompileResult>}
 */
function buildDisabledLookupPlans(definition, resourceTypes, reason) {
    /** @type {Record<string, LookupCompileResult>} */
    const lookupPlans = {};
    for (const resourceType of resourceTypes) {
        lookupPlans[getLookupKey(resourceType, definition.resource.code || "")] = {
            compilable: false,
            reason
        };
    }
    return lookupPlans;
}

module.exports = {
    compileDefinition
};
