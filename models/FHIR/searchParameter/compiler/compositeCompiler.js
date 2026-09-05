const { parseFhirPath } = require("./parserAdapter");
const { validateAst } = require("./astValidator");
const { createSearchQueryPlan } = require("./searchQueryPlan");
const { createDiagnostic } = require("../registry/diagnostics");
const { getBaseResourceTypes, getLookupKey } = require("../registry/identity");
const { getTypeCapability } = require("./capabilityMatrix");
const { createComponentResolver } = require("./componentResolver");
const {
    collectRawPaths,
    filterPathsForResource,
    normalizeBareFieldPaths,
    compileScopeRelativeExtractionPaths,
    resolveScopeContext,
    preprocessResourceExpression
} = require("./extractionPathCompiler");
const {
    attachCompositePlanMetadata,
    buildCompositeRootExtractionPaths
} = require("./planMetadata");

/**
 * @typedef {import('./componentResolver').ComponentResolver} ComponentResolver
 * @typedef {import('./compiler').LookupCompileResult} LookupCompileResult
 */

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {string} resourceType
 * @param {string} lookupKey
 * @param {string} reason
 * @returns {LookupCompileResult}
 */
function disabledLookup(resourceType, reason) {
    return {
        compilable: false,
        reason
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
        lookupPlans[getLookupKey(resourceType, definition.resource.code || "")] = disabledLookup(
            resourceType,
            reason
        );
    }
    return lookupPlans;
}

/**
 * @param {import('../registry/types').SearchParameterComponent} component
 * @param {number} index
 * @param {ComponentResolver} componentResolver
 * @param {string} compositeCanonicalKey
 * @param {string} lookupKey
 * @returns {{
 *   ok: boolean,
 *   reason?: string,
 *   code?: string,
 *   componentDefinition?: import('../registry/types').SearchParameterComponentDefinition,
 *   compositeComponent?: import('./searchQueryPlan').CompositeComponentSummary
 * }}
 */
function resolveComponentMetadata(component, index, componentResolver, compositeCanonicalKey, lookupKey) {
    if (!component.expression) {
        return {
            ok: false,
            reason: `Component ${index + 1} is missing expression`,
            code: "missing-component-expression"
        };
    }

    const resolved = componentResolver.resolve(component.definition || "");
    if (!resolved.found || !resolved.definition) {
        return {
            ok: false,
            reason: resolved.reason || `Component ${index + 1} definition could not be resolved`,
            code: resolved.code || "component-not-found"
        };
    }

    const capability = getTypeCapability(resolved.definition.resource.type || "");
    return {
        ok: true,
        componentDefinition: {
            index,
            definitionKey: resolved.canonicalKey || "",
            definitionUrl: resolved.definitionUrl || resolved.definition.resource.url || "",
            code: resolved.definition.resource.code || "",
            searchType: resolved.definition.resource.type || "",
            expression: component.expression,
            comparators: resolved.definition.resource.comparator || capability?.comparators || [],
            modifiers: resolved.definition.resource.modifier || capability?.modifiers || [],
            multipleOr: resolved.definition.resource.multipleOr !== false,
            multipleAnd: resolved.definition.resource.multipleAnd !== false,
            targets: resolved.definition.resource.target || []
        },
        compositeComponent: {
            canonicalKey: resolved.canonicalKey || "",
            searchType: resolved.definition.resource.type || "",
            expression: component.expression
        }
    };
}

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {ComponentResolver} componentResolver
 * @returns {{ compilable: boolean, reason?: string, lookupPlans: Record<string, LookupCompileResult>, diagnostics: import('../registry/diagnostics').RegistryDiagnostic[] }}
 */
function compileCompositeDefinition(definition, componentResolver) {
    const resource = definition.resource;
    const resourceTypes = getBaseResourceTypes(resource);
    /** @type {import('../registry/diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];
    const components = resource.component || [];

    if (resource.chain?.length) {
        const reason = "Composite search parameters cannot use chained search";
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: [
                createDiagnostic({
                    code: "chained-component",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey
                })
            ]
        };
    }

    if (components.length === 0) {
        const reason = "Composite search parameter requires at least one component";
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: [
                createDiagnostic({
                    code: "missing-component",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey
                })
            ]
        };
    }

    const expression = resource.expression;
    if (!expression) {
        const reason = "Composite search parameter expression is required";
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: [
                createDiagnostic({
                    code: "missing-expression",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey
                })
            ]
        };
    }

    /** @type {import('./searchQueryPlan').CompositeComponentDefinition[]} */
    const compositeComponents = [];
    /** @type {import('./searchQueryPlan').CompositeComponentSummary[]} */
    const componentSummaries = [];

    for (let index = 0; index < components.length; index += 1) {
        const lookupKeyPlaceholder = definition.lookupKeys[0] || "";
        const resolved = resolveComponentMetadata(
            components[index],
            index,
            componentResolver,
            definition.canonicalKey,
            lookupKeyPlaceholder
        );
        if (!resolved.ok || !resolved.componentDefinition || !resolved.compositeComponent) {
            const reason = resolved.reason || "Component definition could not be resolved";
            diagnostics.push(
                createDiagnostic({
                    code: resolved.code || "component-not-found",
                    category: "compile",
                    message: reason,
                    canonicalKey: definition.canonicalKey,
                    expression: components[index].expression
                })
            );
            return {
                compilable: false,
                reason,
                lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
                diagnostics
            };
        }
        compositeComponents.push(resolved.componentDefinition);
        componentSummaries.push(resolved.compositeComponent);
    }

    const parsedRoot = parseFhirPath(expression);
    if (!parsedRoot.success || !parsedRoot.ast) {
        const reason = parsedRoot.error || "Failed to parse composite root expression";
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

    const rootValidation = validateAst(parsedRoot.ast);
    if (!rootValidation.valid) {
        const reason = `Unsupported composite root expression: ${rootValidation.errors.join("; ")}`;
        return {
            compilable: false,
            reason,
            lookupPlans: buildDisabledLookupPlans(definition, resourceTypes, reason),
            diagnostics: rootValidation.errors.map((message) =>
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

    /** @type {Record<string, LookupCompileResult>} */
    const lookupPlans = {};
    let anyCompilable = false;

    for (const resourceType of resourceTypes) {
        const lookupKey = getLookupKey(resourceType, resource.code || "");
        const lookupResult = compileCompositeLookup(
            definition,
            resourceType,
            lookupKey,
            parsedRoot.ast,
            compositeComponents,
            componentSummaries,
            diagnostics
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
            reason: diagnostics[diagnostics.length - 1]?.message || "No executable composite branches",
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
 * @param {string} lookupKey
 * @param {import('./parser/ast').AstNode} rootAst
 * @param {import('./searchQueryPlan').CompositeComponentDefinition[]} compositeComponents
 * @param {import('./searchQueryPlan').CompositeComponentSummary[]} componentSummaries
 * @param {import('../registry/diagnostics').RegistryDiagnostic[]} diagnostics
 * @returns {LookupCompileResult}
 */
function compileCompositeLookup(
    definition,
    resourceType,
    lookupKey,
    rootAst,
    compositeComponents,
    componentSummaries,
    diagnostics
) {
    const resource = definition.resource;
    const { loadResourceTypeMap } = require("./resourceTypeMap");
    const typeMap = loadResourceTypeMap(resourceType);
    if (!typeMap) {
        const reason = `Resource type map not found for ${resourceType}`;
        diagnostics.push(
            createDiagnostic({
                code: "missing-type-map",
                category: "compile",
                message: reason,
                canonicalKey: definition.canonicalKey,
                lookupKey
            })
        );
        return { compilable: false, reason };
    }

    const rawRootPaths = filterPathsForResource(
        normalizeBareFieldPaths(collectRawPaths(rootAst, resourceType, typeMap), resourceType, typeMap),
        resourceType
    );

    if (rawRootPaths.length === 0) {
        return {
            compilable: false,
            reason: `No executable composite root scopes for ${resourceType}`
        };
    }

    /** @type {import('./searchQueryPlan').CompositeRootBranch[]} */
    const branches = [];

    for (const rawRootPath of rawRootPaths) {
        const scopePath = rawRootPath.segments.join(".");
        const scopeContext = resolveScopeContext(typeMap, scopePath);
        if (!scopeContext.found) {
            diagnostics.push(
                createDiagnostic({
                    code: "incompatible-branch",
                    category: "compile",
                    message: `Composite root scope ${scopePath || resourceType} is missing from ${resourceType} type map`,
                    canonicalKey: definition.canonicalKey,
                    lookupKey,
                    expression: resource.expression
                })
            );
            continue;
        }

        /** @type {import('./searchQueryPlan').CompositeBranchComponent[]} */
        const branchComponents = [];
        let branchFailed = false;

        for (const componentDefinition of compositeComponents) {
            const processedExpression = preprocessResourceExpression(
                componentDefinition.expression,
                resourceType
            );
            const parsedComponent = parseFhirPath(processedExpression);
            if (!parsedComponent.success || !parsedComponent.ast) {
                branchFailed = true;
                diagnostics.push(
                    createDiagnostic({
                        code: "parse-failed",
                        category: "compile",
                        message:
                            parsedComponent.error ||
                            `Failed to parse component expression ${componentDefinition.expression}`,
                        canonicalKey: definition.canonicalKey,
                        lookupKey,
                        expression: componentDefinition.expression
                    })
                );
                break;
            }

            const componentValidation = validateAst(parsedComponent.ast);
            if (!componentValidation.valid) {
                branchFailed = true;
                diagnostics.push(
                    createDiagnostic({
                        code: "unsupported-syntax",
                        category: "compile",
                        message: `Unsupported component expression ${componentDefinition.expression}: ${componentValidation.errors.join("; ")}`,
                        canonicalKey: definition.canonicalKey,
                        lookupKey,
                        expression: componentDefinition.expression
                    })
                );
                break;
            }

            const { extractionPaths, diagnostics: componentDiagnostics } =
                compileScopeRelativeExtractionPaths({
                    definition,
                    lookupKey,
                    resourceType,
                    scopeContext,
                    componentDefinition,
                    ast: parsedComponent.ast
                });
            diagnostics.push(...componentDiagnostics);

            if (extractionPaths.length === 0) {
                branchFailed = true;
                break;
            }

            branchComponents.push({
                componentIndex: componentDefinition.index,
                extractionPath: extractionPaths[0]
            });
        }

        if (branchFailed || branchComponents.length !== compositeComponents.length) {
            continue;
        }

        branches.push({
            branchId: scopePath || resourceType,
            correlationMode: scopeContext.correlationMode,
            scopePath,
            components: branchComponents
        });
    }

    if (branches.length === 0) {
        return {
            compilable: false,
            reason: `No executable composite extraction branches for ${resourceType}`
        };
    }

    const metadata = attachCompositePlanMetadata({
        resource,
        compositeComponents,
        componentSummaries,
        branches
    });

    return {
        compilable: true,
        plan: createSearchQueryPlan({
            canonicalKey: definition.canonicalKey,
            resourceType,
            code: resource.code || "",
            searchType: "composite",
            kind: "composite",
            extractionPaths: metadata.extractionPaths,
            ast: rootAst,
            multipleOr: resource.multipleOr !== false,
            multipleAnd: resource.multipleAnd !== false,
            comparators: [],
            modifiers: [],
            targets: [],
            supportedValueForms: [],
            depth: compositeComponents.length,
            estimatedCost: metadata.estimatedCost,
            requiredIndexes: metadata.requiredIndexes,
            diagnostics: [],
            componentCount: compositeComponents.length,
            components: metadata.components,
            composite: metadata.composite
        })
    };
}

module.exports = {
    createComponentResolver,
    compileCompositeDefinition
};
