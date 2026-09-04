const { ensureRegistryLoaded } = require("../registry/registryManager");
const { resolveLookupStatus, getEffectiveDefinition } = require("../registry/snapshot");
const { applyPlanToQuery } = require("../executor/mongoExecutor");
const { validateAndBuildFilter } = require("../executor/queryValueParser");
const { buildRelationPlan, buildRelationAggregation } = require("../executor/relationPlan");
const { parseSearchParameterName } = require("./parameterName");
const { InvalidSearchParameterValueError } = require("./searchParameterErrors");
const {
    RelationLimitSearchParameterError,
    isRelationLimitClass
} = require("./relationLimitErrors");

/**
 * @param {Object} options
 * @param {string} options.resourceType
 * @param {Object} options.query
 * @param {string} options.parameterName
 * @returns {Promise<'handled' | 'disabled'>}
 */
async function tryApplyRegistryParameter(options) {
    const { resourceType, query, parameterName } = options;

    const parsed = parseSearchParameterName(parameterName);
    const snapshot = await ensureRegistryLoaded();
    const lookupStatus = resolveLookupStatus(snapshot, resourceType, parsed.code);
    if (lookupStatus === "disabled" || lookupStatus === "unknown") {
        return "disabled";
    }

    const definition = getEffectiveDefinition(snapshot, resourceType, parsed.code);
    if (!definition?.compiledPlan) {
        return "disabled";
    }

    const plan = definition.compiledPlan;

    if (parsed.chain) {
        const relation = buildRelationPlan(plan, parsed, snapshot);
        if (!relation.valid) {
            if (isRelationLimitClass(relation.class)) {
                throw new RelationLimitSearchParameterError(parameterName, relation.class);
            }
            return "disabled";
        }
        if (!relation.relationPlan) {
            return "disabled";
        }
        let aggregation;
        try {
            aggregation = buildRelationAggregation(
                relation.relationPlan,
                query[parameterName]
            );
        } catch (error) {
            throw new InvalidSearchParameterValueError(
                error instanceof Error ? error.message : String(error)
            );
        }
        if (!query.chain) {
            query.chain = [];
        }
        query.isChain = true;
        query.chain.push(...aggregation.chain);
        delete query[parameterName];
        return "handled";
    }

    const filterResult = validateAndBuildFilter(plan, query[parameterName], parameterName);
    if (!filterResult.valid) {
        throw new InvalidSearchParameterValueError(filterResult.reason || "Invalid search query");
    }
    applyPlanToQuery(plan, query, parameterName, filterResult.filterPlan);

    return "handled";
}

module.exports = {
    tryApplyRegistryParameter
};
