const { getTypeCapability, validatePlanOperator } = require("../compiler/capabilityMatrix");
const { getCommaSplitArray } = require("./queryPrimitives");
const {
    buildProjectedFilter,
    buildDeceasedCombinedFilter
} = require("./searchTypeProjection");

const MAX_QUERY_COST = 10;
const COMPARATOR_PREFIX = /^(eq|ne|lt|gt|ge|le|sa|eb|ap)(.+)$/;

/**
 * @typedef {Object} ParsedValueToken
 * @property {string} value
 * @property {string | undefined} comparator
 */

/**
 * @typedef {Object} ParsedSearchValue
 * @property {ParsedValueToken[][]} groups
 * @property {'and' | 'or'} conjunction
 * @property {string | undefined} modifier
 */

/**
 * @param {string} rawValue
 * @param {string} [searchType]
 * @returns {ParsedValueToken}
 */
function parseValueToken(rawValue, searchType) {
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

    return {
        groups: rawGroups.map((group) =>
            getCommaSplitArray(group).map((token) => parseValueToken(token, searchType))
        ),
        conjunction: isRepeated ? "and" : "or",
        modifier
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} value
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildFilterForValue(plan, value, modifier, comparator) {
    if (plan.code === "deceased" && modifier !== "missing") {
        return buildDeceasedCombinedFilter(plan, value, modifier, comparator);
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
            entry.predicates
        )
    );

    if (branchFilters.length === 1) {
        return branchFilters[0];
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
        buildFilterForValue(plan, token.value, modifier, token.comparator)
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
 * @returns {{ valid: boolean, reason?: string, filter?: Object }}
 */
function validateAndBuildFilter(plan, rawValue, parameterName) {
    if (plan.estimatedCost > MAX_QUERY_COST) {
        return { valid: false, reason: "Estimated query cost exceeds limit" };
    }

    const parsed = parseSearchValue(rawValue, parameterName, plan.searchType);
    const tokens = parsed.groups.flat();
    if (tokens.length === 0) {
        return { valid: false, reason: "Missing search value" };
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

    const groupFilters = parsed.groups.map((group) =>
        buildGroupFilter(group, plan, parsed.modifier)
    );

    if (groupFilters.length === 1) {
        return { valid: true, filter: groupFilters[0] };
    }

    return {
        valid: true,
        filter: {
            [parsed.conjunction === "and" ? "$and" : "$or"]: groupFilters
        }
    };
}

module.exports = {
    MAX_QUERY_COST,
    parseSearchValue,
    validateAndBuildFilter,
    buildFilterForValue
};
