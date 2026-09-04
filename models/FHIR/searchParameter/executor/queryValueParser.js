const { getTypeCapability, validatePlanOperator } = require("../compiler/capabilityMatrix");
const { buildBundleInlineDirectFilter } = require("./bundleInlineDirectFilter");
const { getCommaSplitArray } = require("./queryPrimitives");
const {
    buildProjectedFilter,
    buildDeceasedCombinedFilter
} = require("./searchTypeProjection");
const temporalQuery = require("./temporalQuery");
const {
    TEMPORAL_KINDS,
    normalizeTemporalQueryRange,
    splitComparatorPrefix
} = temporalQuery;

const MAX_QUERY_COST = 10;
const COMPARATOR_PREFIX = /^(eq|ne|lt|gt|ge|le|sa|eb|ap)(.+)$/;

/**
 * @typedef {Object} ParsedValueToken
 * @property {string} value
 * @property {string | undefined} comparator
 * @property {import('./temporalQueryParser').TemporalQueryValue} [temporal]
 * @property {Error} [temporalError]
 */

/**
 * @typedef {Object} ParsedSearchValue
 * @property {ParsedValueToken[][]} groups
 * @property {'and' | 'or'} conjunction
 * @property {string | undefined} modifier
 * @property {Error[]} [errors]
 */

/**
 * @param {string} rawValue
 * @param {string} [searchType]
 * @param {string} [modifier]
 * @returns {ParsedValueToken}
 */
function parseValueToken(rawValue, searchType, modifier) {
    if (searchType && TEMPORAL_KINDS.has(searchType) && modifier !== "missing") {
        const split = splitComparatorPrefix(rawValue);
        try {
            const temporal = temporalQuery.parseTemporalQueryValue(rawValue, searchType);
            return {
                value: temporal.value,
                comparator: temporal.comparator,
                temporal
            };
        } catch (error) {
            return {
                value: split.value,
                comparator: split.comparator,
                temporalError: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    const capability = searchType ? getTypeCapability(searchType) : null;
    if (capability?.comparators.length) {
        const prefixMatch = COMPARATOR_PREFIX.exec(rawValue);
        if (prefixMatch) {
            return { comparator: prefixMatch[1], value: prefixMatch[2] };
        }
    }
    return { value: rawValue, comparator: undefined };
}

/**
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @param {string} [searchType]
 * @returns {ParsedSearchValue}
 */
function parseSearchValue(rawValue, parameterName, searchType) {
    const modifierParts = parameterName.split(":").slice(1);
    const modifier = modifierParts.length > 0 ? modifierParts.join(":") : undefined;
    const isRepeated = Array.isArray(rawValue);
    const rawGroups = isRepeated ? rawValue.map(String) : [String(rawValue)];
    const groups = rawGroups.map((group) =>
        getCommaSplitArray(group).map((token) =>
            parseValueToken(token, searchType, modifier)
        )
    );

    const parsed = {
        groups,
        conjunction: isRepeated ? "and" : "or",
        modifier
    };
    const errors = groups
        .flat()
        .map((token) => token.temporalError)
        .filter((error) => error !== undefined);
    if (searchType && TEMPORAL_KINDS.has(searchType)) {
        parsed.errors = errors;
    }
    return parsed;
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} value
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @param {import('./temporalQueryParser').TemporalQueryValue | undefined} [temporal]
 * @returns {Object}
 */
function buildFilterForValue(plan, value, modifier, comparator, temporal) {
    if (plan.code === "deceased" && modifier !== "missing") {
        return buildDeceasedCombinedFilter(plan, value, modifier, comparator, temporal);
    }

    if (plan.inlineTarget && plan.searchType === "reference") {
        return buildBundleInlineDirectFilter(plan.inlineTarget, value, modifier);
    }

    const branchFilters = plan.extractionPaths.map((entry) =>
        buildProjectedFilter(
            plan.searchType,
            value,
            entry.path,
            entry.datatype,
            modifier,
            comparator,
            entry.referenceTargetType,
            entry.predicates,
            temporal,
            entry.arrayPaths
        )
    );

    if (branchFilters.length === 1) {
        return branchFilters[0];
    }

    if (modifier === "missing" && (plan.searchType === "date" || plan.searchType === "dateTime")) {
        return String(value) === "true"
            ? { $and: branchFilters }
            : { $or: branchFilters };
    }

    return { $or: branchFilters };
}

/**
 * @param {ParsedValueToken[]} tokens
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildGroupFilter(tokens, plan, modifier) {
    const filters = tokens.map((token) =>
        buildFilterForValue(plan, token.value, modifier, token.comparator, token.temporal)
    );
    if (filters.length === 1) {
        return filters[0];
    }
    return { $or: filters };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @returns {{ valid: boolean, reason?: string, filter?: Object, filterPlan?: TypedFilterPlan }}
 */
function buildFilterPlanResult(plan, rawValue, parameterName) {
    if (plan.estimatedCost > MAX_QUERY_COST) {
        return { valid: false, reason: "Estimated query cost exceeds limit" };
    }

    const parsed = parseSearchValue(rawValue, parameterName, plan.searchType);
    const tokens = parsed.groups.flat();
    if (tokens.length === 0) {
        return { valid: false, reason: "Missing search value" };
    }
    if (parsed.errors?.length) {
        return {
            valid: false,
            reason: parsed.errors.map((error) => error.message).join("; "),
            errors: parsed.errors
        };
    }

    for (const token of tokens) {
        const operatorValidation = validatePlanOperator(
            plan,
            parsed.modifier,
            token.comparator
        );
        if (!operatorValidation.valid) {
            return { valid: false, reason: operatorValidation.reason };
        }
    }

    if (
        parsed.modifier === "missing" &&
        parsed.groups.some((group) =>
            group.some((token) => !["true", "false"].includes(token.value))
        )
    ) {
        return { valid: false, reason: "missing modifier requires true or false" };
    }

    const capability = getTypeCapability(plan.searchType);
    if (!capability) {
        return { valid: false, reason: `Unsupported search type: ${plan.searchType}` };
    }

    const hasCommaOr = parsed.groups.some((group) => group.length > 1);
    if (hasCommaOr && (!capability.multipleOr || plan.multipleOr === false)) {
        return { valid: false, reason: "multipleOr is not allowed for this parameter" };
    }

    if (
        parsed.conjunction === "and" &&
        parsed.groups.length > 1 &&
        (!capability.multipleAnd || plan.multipleAnd === false)
    ) {
        return { valid: false, reason: "multipleAnd is not allowed for this parameter" };
    }

    if (plan.extractionPaths.length === 0) {
        return { valid: false, reason: "Missing extraction paths in query plan" };
    }

    /** @type {Object[]} */
    let groupFilters;
    try {
        groupFilters = parsed.groups.map((group) =>
            buildGroupFilter(group, plan, parsed.modifier)
        );
    } catch (error) {
        return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }

    let filter;
    if (groupFilters.length === 1) {
        filter = groupFilters[0];
    } else {
        filter = {
            [parsed.conjunction === "and" ? "$and" : "$or"]: groupFilters
        };
    }

    return {
        valid: true,
        filter,
        filterPlan: {
            kind: TEMPORAL_KINDS.has(plan.searchType)
                ? "temporal-filter-plan"
                : "typed-filter-plan",
            searchPlan: plan,
            parameterName,
            rawValue,
            parsed,
            filter
        }
    };
}

/**
 * @typedef {Object} TypedFilterPlan
 * @property {'typed-filter-plan' | 'temporal-filter-plan'} kind
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} searchPlan
 * @property {string} parameterName
 * @property {string | string[]} rawValue
 * @property {ParsedSearchValue} parsed
 * @property {Object} filter
 */

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @returns {{ valid: boolean, reason?: string, filter?: Object, filterPlan?: TypedFilterPlan }}
 */
function validateAndBuildFilter(plan, rawValue, parameterName) {
    return buildFilterPlanResult(plan, rawValue, parameterName);
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @returns {TypedFilterPlan}
 */
function createTypedFilterPlan(plan, rawValue, parameterName) {
    const result = buildFilterPlanResult(plan, rawValue, parameterName);
    if (!result.valid || !result.filterPlan) {
        throw new Error(result.reason || "Invalid search query");
    }
    return result.filterPlan;
}

module.exports = {
    MAX_QUERY_COST,
    normalizeTemporalQueryRange,
    parseTemporalQueryValue: temporalQuery.parseTemporalQueryValue,
    parseSearchValue,
    validateAndBuildFilter,
    buildFilterForValue,
    createTypedFilterPlan
};
