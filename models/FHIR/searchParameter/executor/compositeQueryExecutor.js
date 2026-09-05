const { getTypeCapability, validatePlanOperator } = require("../compiler/capabilityMatrix");
const {
    parseCompositeSearchValue,
    preservePrimitiveEscapes
} = require("./compositeValueParser");
const { buildCompositeFilter } = require("./compositeFilterBuilder");
const {
    MAX_QUERY_COST,
    parseValueToken,
    validateAndBuildFilter
} = require("./queryValueParser");

/**
 * @typedef {import('./queryValueParser').TypedFilterPlan} TypedFilterPlan
 * @typedef {import('./compositeValueParser').ParsedCompositeSearchValue} ParsedCompositeSearchValue
 * @typedef {import('./compositePlanTypes').CompositeComponentDefinition} CompositeComponentDefinition
 */

/**
 * @param {CompositeComponentDefinition} component
 * @returns {import('../compiler/searchQueryPlan').SearchQueryPlan}
 */
function createComponentOperatorPlan(component) {
    return {
        searchType: component.searchType,
        comparators: component.comparators || [],
        modifiers: component.modifiers || [],
        multipleOr: component.multipleOr !== false,
        multipleAnd: component.multipleAnd !== false
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {CompositeComponentDefinition} component
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @param {string} value
 * @returns {{ valid: boolean, reason?: string }}
 */
function validatePrimitiveComponentValue(plan, component, extractionPath, value) {
    const result = validateAndBuildFilter(
        {
            canonicalKey: plan.canonicalKey,
            resourceType: plan.resourceType,
            code: component.code,
            searchType: component.searchType,
            kind: "filter",
            extractionPaths: [extractionPath],
            multipleOr: component.multipleOr !== false,
            multipleAnd: component.multipleAnd !== false,
            comparators: component.comparators || [],
            modifiers: component.modifiers || [],
            targets: component.targets || [],
            estimatedCost: 1
        },
        value,
        component.code
    );
    return result.valid ? { valid: true } : { valid: false, reason: result.reason };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} modifier
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateCompositeParameterName(plan, modifier) {
    if (modifier) {
        return {
            valid: false,
            reason: "Composite search parameters do not support modifiers"
        };
    }
    if (plan.searchType !== "composite") {
        return { valid: false, reason: "Search query plan is not composite" };
    }
    if (!plan.composite?.components?.length) {
        return {
            valid: false,
            reason: "Composite search parameter is missing component metadata"
        };
    }
    if (!plan.composite.branches?.length) {
        return {
            valid: false,
            reason: "Composite search parameter is missing executable branches"
        };
    }
    return { valid: true };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {ParsedCompositeSearchValue} parsed
 * @returns {{ valid: boolean, reason?: string, errors?: Error[] }}
 */
function validateCompositeComponentTokens(plan, parsed) {
    const composite = plan.composite;
    if (!composite) {
        return {
            valid: false,
            reason: "Composite search parameter is missing component metadata"
        };
    }

    /** @type {Error[]} */
    const errors = [];

    for (const group of parsed.groups) {
        for (const pair of group.pairs) {
            /** @type {import('./compositeValueParser').ParsedCompositeComponentToken[]} */
            const tokens = [];
            for (
                let componentIndex = 0;
                componentIndex < pair.components.length;
                componentIndex += 1
            ) {
                const component = composite.components[componentIndex];
                if (!component) {
                    throw new Error("Composite component metadata is incomplete");
                }
                const componentValue = preservePrimitiveEscapes(
                    pair.rawComponents[componentIndex],
                    component.searchType
                );

                const capability = getTypeCapability(component.searchType);
                if (!capability) {
                    throw new Error(`Unsupported component search type: ${component.searchType}`);
                }

                const token = parseValueToken(componentValue, component.searchType, undefined);
                if (token.temporalError) {
                    errors.push(token.temporalError);
                }

                const operatorValidation = validatePlanOperator(
                    createComponentOperatorPlan(component),
                    undefined,
                    token.comparator
                );
                if (!operatorValidation.valid) {
                    return {
                        valid: false,
                        reason: operatorValidation.reason
                    };
                }

                const validationBranch = composite.branches?.[0];
                const validationPath =
                    validationBranch?.components?.[componentIndex]?.extractionPath;
                if (!validationPath) {
                    return {
                        valid: false,
                        reason: "Composite component extraction metadata is incomplete"
                    };
                }
                const primitiveValidation = validatePrimitiveComponentValue(
                    plan,
                    component,
                    validationPath,
                    componentValue
                );
                if (!primitiveValidation.valid) {
                    return primitiveValidation;
                }

                tokens.push(token);
            }
            pair.tokens = tokens;
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            reason: errors.map((error) => error.message).join("; "),
            errors
        };
    }

    return { valid: true };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @param {string | undefined} [modifier]
 * @returns {{ valid: boolean, reason?: string, filter?: Object, filterPlan?: TypedFilterPlan, errors?: Error[] }}
 */
function buildCompositeFilterPlanResult(plan, rawValue, parameterName, modifier) {
    const parameterValidation = validateCompositeParameterName(plan, modifier);
    if (!parameterValidation.valid) {
        return parameterValidation;
    }

    if (plan.estimatedCost > MAX_QUERY_COST) {
        return { valid: false, reason: "Estimated query cost exceeds limit" };
    }

    let parsed;
    try {
        parsed = parseCompositeSearchValue(rawValue, plan.composite.components.length);
    } catch (error) {
        return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }

    const tokenValidation = validateCompositeComponentTokens(plan, parsed);
    if (!tokenValidation.valid) {
        return tokenValidation;
    }

    let filter;
    try {
        filter = buildCompositeFilter(plan, parsed);
    } catch (error) {
        return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }

    return {
        valid: true,
        filter,
        filterPlan: {
            kind: "typed-filter-plan",
            searchPlan: plan,
            parameterName,
            rawValue,
            parsed,
            filter
        }
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @param {string | undefined} [modifier]
 * @returns {{ valid: boolean, reason?: string, filter?: Object, filterPlan?: TypedFilterPlan, errors?: Error[] }}
 */
function validateAndBuildCompositeFilter(plan, rawValue, parameterName, modifier) {
    return buildCompositeFilterPlanResult(plan, rawValue, parameterName, modifier);
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @param {string | undefined} [modifier]
 * @returns {TypedFilterPlan}
 */
function createCompositeFilterPlan(plan, rawValue, parameterName, modifier) {
    const result = buildCompositeFilterPlanResult(plan, rawValue, parameterName, modifier);
    if (!result.valid || !result.filterPlan) {
        throw new Error(result.reason || "Invalid composite search query");
    }
    return result.filterPlan;
}

module.exports = {
    validateAndBuildCompositeFilter,
    createCompositeFilterPlan,
    validateCompositeParameterName,
    validateCompositeComponentTokens,
    createComponentOperatorPlan
};
