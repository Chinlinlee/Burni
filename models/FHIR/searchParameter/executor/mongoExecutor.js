const _ = require("lodash");
const {
    createTypedFilterPlan,
    MAX_QUERY_COST
} = require("./queryValueParser");
const { createCompositeFilterPlan } = require("./compositeQueryExecutor");

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
    "$elemMatch",
    "$type",
    "$expr",
    "$function"
]);

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | string[]} rawValue
 * @param {string} parameterName
 * @param {import('./queryValueParser').TypedFilterPlan} [typedFilterPlan]
 * @returns {Object}
 */
function executeSearchQueryPlan(plan, rawValue, parameterName, typedFilterPlan) {
    if (plan.kind === "relation") {
        throw new Error("Relation plans must be executed through relation executor");
    }
    const filterPlan =
        typedFilterPlan ||
        (plan.searchType === "composite"
            ? createCompositeFilterPlan(plan, rawValue, parameterName)
            : createTypedFilterPlan(plan, rawValue, parameterName));
    if (filterPlan.searchPlan !== plan) {
        throw new Error("Typed filter plan does not belong to search query plan");
    }
    assertSafeFilter(filterPlan.filter);
    return filterPlan.filter;
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
 * @param {import('./queryValueParser').TypedFilterPlan} [typedFilterPlan]
 * @returns {import('./queryValueParser').TypedFilterPlan}
 */
function applyPlanToQuery(plan, query, parameterName, typedFilterPlan) {
    const filterPlan =
        typedFilterPlan ||
        (plan.searchType === "composite"
            ? createCompositeFilterPlan(plan, query[parameterName], parameterName)
            : createTypedFilterPlan(plan, query[parameterName], parameterName));
    if (filterPlan.searchPlan !== plan) {
        throw new Error("Typed filter plan does not belong to search query plan");
    }
    if (!query.$and) {
        query.$and = [];
    }
    query.$and.push(filterPlan.filter);
    delete query[parameterName];
    return filterPlan;
}

module.exports = {
    MAX_QUERY_COST,
    executeSearchQueryPlan,
    applyPlanToQuery,
    assertSafeFilter
};
