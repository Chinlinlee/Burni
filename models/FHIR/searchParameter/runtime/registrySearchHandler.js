const { logger } = require("@root/utils/log");
const { ensureRegistryLoaded } = require("../registry/registryManager");
const { resolveLookupStatus, getEffectiveDefinition } = require("../registry/snapshot");
const { applyPlanToQuery } = require("../executor/mongoExecutor");
const { buildRelationPlan, buildRelationAggregation } = require("../executor/relationPlan");
const {
    featureFlags,
    isRegistryEnabledForResource,
    isShadowCompareEnabledForResource
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
        return "fallback";
    }

    const snapshot = await ensureRegistryLoaded();
    const lookupStatus = resolveLookupStatus(snapshot, resourceType, parameterName);
    if (lookupStatus === "disabled") {
        return "disabled";
    }
    if (lookupStatus === "unknown") {
        return featureFlags.legacyFallbackEnabled ? "fallback" : "disabled";
    }

    const definition = getEffectiveDefinition(snapshot, resourceType, parameterName);
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

    if (parameterName.includes(".")) {
        const relation = buildRelationPlan(plan, parameterName.split(".").slice(1).join("."), snapshot);
        if (!relation.valid || !relation.relationPlan) {
            return "disabled";
        }
        const aggregation = buildRelationAggregation(relation.relationPlan, String(rawValue));
        Object.assign(query, aggregation);
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
