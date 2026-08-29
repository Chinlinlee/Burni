const _ = require("lodash");
const { validateAndBuildFilter } = require("./queryValueParser");
const { MAX_QUERY_COST } = require("./queryValueParser");

const ALLOWED_OPERATORS = new Set([
    "$and",
    "$or",
    "$nor",
    "$eq",
    "$ne",
    "$gt",
    "$gte",
    "$lt",
    "$lte",
    "$in",
    "$nin",
    "$regex",
    "$exists",
    "$elemMatch"
]);

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @returns {Object}
 */
function executeSearchQueryPlan(plan, rawValue, parameterName) {
    if (plan.kind === "relation") {
        throw new Error("Relation plans must be executed through relation executor");
    }
    const result = validateAndBuildFilter(plan, rawValue, parameterName);
    if (!result.valid || !result.filter) {
        throw new Error(result.reason || "Invalid search query");
    }
    assertSafeFilter(result.filter);
    return result.filter;
}

/**
 * @param {Object} filter
 */
function assertSafeFilter(filter) {
    if (filter.$where) {
        throw new Error("$where is not allowed");
    }
    for (const key of Object.keys(filter)) {
        if (key.startsWith("$") && !ALLOWED_OPERATORS.has(key)) {
            throw new Error(`Operator ${key} is not allowed`);
        }
        const value = filter[key];
        if (_.isPlainObject(value)) {
            assertSafeFilter(value);
        }
    }
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Object} query
 * @param {string} parameterName
 */
function applyPlanToQuery(plan, query, parameterName) {
    const rawValue = query[parameterName];
    const filter = executeSearchQueryPlan(plan, rawValue, parameterName);
    if (!query.$and) {
        query.$and = [];
    }
    query.$and.push(filter);
    delete query[parameterName];
}

module.exports = {
    MAX_QUERY_COST,
    executeSearchQueryPlan,
    applyPlanToQuery,
    assertSafeFilter
};
