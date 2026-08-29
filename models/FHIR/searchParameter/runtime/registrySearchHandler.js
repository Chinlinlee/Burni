const { logger } = require("@root/utils/log");
const { ensureRegistryLoaded } = require("../registry/registryManager");
const { resolveLookupStatus, getEffectiveDefinition } = require("../registry/snapshot");
const { applyPlanToQuery } = require("../executor/mongoExecutor");
const { buildRelationPlan, buildRelationAggregation } = require("../executor/relationPlan");
const { parseSearchParameterName } = require("./parameterName");
const {
    isRegistryEnabledForResource,
    isShadowCompareEnabledForResource,
    isLegacyFallbackEnabledForResource
} = require("../config/featureFlags");
const { compareWithLegacyHandler } = require("./shadowComparison");

/**
 * @param {Object} options
 * @param {string} options.resourceType
 * @param {Object} options.query
 * @param {string} options.parameterName
 * @param {Object} options.paramsSearch
 * @returns {Promise<'handled' | 'disabled' | 'fallback' | 'shadow-only'>}
 */
async function tryApplyRegistryParameter(options) {
    const { resourceType, query, parameterName, paramsSearch } = options;
    const registryEnabled = isRegistryEnabledForResource(resourceType);
    const shadowEnabled = isShadowCompareEnabledForResource(resourceType);

    if (!registryEnabled && !shadowEnabled) {
        return isLegacyFallbackEnabledForResource(resourceType) ? "fallback" : "disabled";
    }

    const parsed = parseSearchParameterName(parameterName);
    const snapshot = await ensureRegistryLoaded();
    const lookupStatus = resolveLookupStatus(snapshot, resourceType, parsed.code);
    if (lookupStatus === "disabled") {
        return "disabled";
    }
    if (lookupStatus === "unknown") {
        return isLegacyFallbackEnabledForResource(resourceType) ? "fallback" : "disabled";
    }

    const definition = getEffectiveDefinition(snapshot, resourceType, parsed.code);
    if (!definition?.compiledPlan) {
        return "disabled";
    }

    const plan = definition.compiledPlan;
    const rawValue = query[parameterName];

    if (!registryEnabled && shadowEnabled) {
        await compareWithLegacyHandler({
            resourceType,
            parameterName,
            queryValue: rawValue,
            paramsSearch,
            plan,
            source: "runtime-shadow-only"
        });
        return "shadow-only";
    }

    if (parsed.chain) {
        const relation = buildRelationPlan(plan, parsed.chain, snapshot, parsed.typeFilter);
        if (!relation.valid || !relation.relationPlan) {
            return "disabled";
        }
        const aggregation = buildRelationAggregation(relation.relationPlan, rawValue);
        if (!query.chain) {
            query.chain = [];
        }
        query.isChain = true;
        query.chain.push(...aggregation.chain);
        delete query[parameterName];
        return "handled";
    }

    applyPlanToQuery(plan, query, parameterName);

    if (shadowEnabled) {
        await compareWithLegacyHandler({
            resourceType,
            parameterName,
            queryValue: rawValue,
            paramsSearch,
            plan,
            source: "runtime"
        });
    }

    return "handled";
}

module.exports = {
    tryApplyRegistryParameter
};
