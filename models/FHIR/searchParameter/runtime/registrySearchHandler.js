const { ensureRegistryLoaded } = require("../registry/registryManager");
const { resolveLookupStatus, getEffectiveDefinition } = require("../registry/snapshot");
const { applyPlanToQuery } = require("../executor/mongoExecutor");
const { buildRelationPlan, buildRelationAggregation } = require("../executor/relationPlan");
const { parseSearchParameterName } = require("./parameterName");

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
        if (!relation.valid || !relation.relationPlan) {
            return "disabled";
        }
        const aggregation = buildRelationAggregation(
            relation.relationPlan,
            query[parameterName]
        );
        if (!query.chain) {
            query.chain = [];
        }
        query.isChain = true;
        query.chain.push(...aggregation.chain);
        delete query[parameterName];
        return "handled";
    }

    applyPlanToQuery(plan, query, parameterName);

    return "handled";
}

module.exports = {
    tryApplyRegistryParameter
};
