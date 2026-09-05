const productionResources = require("../../fhir.resourceList.json");
const { resolveLookupStatus } = require("../registry/snapshot");

/**
 * @typedef {'compiled' | 'disabled' | 'unsupported' | 'no-lookup'} LookupOutcome
 * @typedef {'pending' | 'official' | 'derived' | 'synthetic' | 'not-applicable'} FixtureCoverage
 */

/**
 * @param {import('../registry/types').SearchParameterDefinition} definition
 * @param {string} lookupKey
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @returns {{ outcome: LookupOutcome, reason?: string }}
 */
function classifyLookup(definition, lookupKey, snapshot) {
    const status = resolveLookupStatus(snapshot, ...lookupKey.split("::"));
    if (status === "effective") {
        return { outcome: "compiled" };
    }

    const type = definition.resource.type || "";
    const disableReason = definition.disableReason || "";
    const lookupPlan = definition.lookupPlans?.[lookupKey];

    if (type === "special") {
        return { outcome: "unsupported", reason: `Unsupported SearchParameter type: ${type}` };
    }
    if (!definition.resource.expression) {
        return { outcome: "unsupported", reason: "Missing expression" };
    }
    if (disableReason.includes("Unsupported SearchParameter type")) {
        return { outcome: "unsupported", reason: disableReason };
    }
    if (lookupPlan && !lookupPlan.compilable && lookupPlan.reason) {
        if (
            lookupPlan.reason.includes("Unsupported") ||
            lookupPlan.reason.includes("not supported") ||
            lookupPlan.reason.includes("Missing expression")
        ) {
            return { outcome: "unsupported", reason: lookupPlan.reason };
        }
    }

    return {
        outcome: "disabled",
        reason: disableReason || lookupPlan?.reason || "Not compilable"
    };
}

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} definitions
 * @returns {Object}
 */
function buildLookupMatrix(snapshot, definitions) {
    /** @type {Map<string, import('../registry/types').SearchParameterDefinition>} */
    const definitionByLookupKey = new Map();
    for (const definition of definitions) {
        for (const lookupKey of definition.lookupKeys) {
            definitionByLookupKey.set(lookupKey, definition);
        }
    }

    /** @type {Record<string, { lookupCount: number, lookups: Record<string, Object> }>} */
    const resources = {};
    /** @type {Object[]} */
    const abstractLookups = [];
    const summary = {
        compiled: 0,
        disabled: 0,
        unsupported: 0,
        noLookupResources: /** @type {string[]} */ ([])
    };

    for (const [lookupKey, definition] of definitionByLookupKey) {
        const [lookupResourceType, code] = lookupKey.split("::");
        if (!productionResources.includes(lookupResourceType)) {
            const classification = classifyLookup(definition, lookupKey, snapshot);
            abstractLookups.push({
                lookupKey,
                resourceType: lookupResourceType,
                code,
                outcome: classification.outcome,
                reason: classification.reason,
                searchType: definition.resource.type,
                canonicalKey: definition.canonicalKey
            });
            continue;
        }

        if (!resources[lookupResourceType]) {
            resources[lookupResourceType] = { lookupCount: 0, lookups: {} };
        }

        const classification = classifyLookup(definition, lookupKey, snapshot);
        summary[classification.outcome] += 1;
        resources[lookupResourceType].lookupCount += 1;
        resources[lookupResourceType].lookups[code] = {
            lookupKey,
            outcome: classification.outcome,
            reason: classification.reason,
            searchType: definition.resource.type,
            canonicalKey: definition.canonicalKey,
            rawStatus: definition.rawStatus,
            effectiveStatus: definition.effectiveStatus,
            fixtureCoverage: classification.outcome === "compiled" ? "pending" : "not-applicable"
        };
    }

    for (const resourceType of productionResources) {
        if (!resources[resourceType]) {
            summary.noLookupResources.push(resourceType);
            resources[resourceType] = {
                lookupCount: 0,
                outcome: "no-lookup",
                fixtureCoverage: "not-applicable",
                lookups: {}
            };
        }
    }

    const totalLookups = summary.compiled + summary.disabled + summary.unsupported;

    return {
        generatedAt: new Date().toISOString(),
        resourceCount: productionResources.length,
        lookupCount: totalLookups,
        totalSourceLookupCount: totalLookups + abstractLookups.length,
        abstractLookups,
        resources,
        summary
    };
}

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} definitions
 * @returns {import('../registry/types').SearchParameterDefinition[]}
 */
function collectDefinitionsFromSnapshot(snapshot, definitions) {
    return definitions;
}

module.exports = {
    classifyLookup,
    buildLookupMatrix,
    collectDefinitionsFromSnapshot
};
