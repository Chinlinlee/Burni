const { parseLookupKey } = require("../registry/identity");

const MAX_RELATION_DEPTH = 1;

/**
 * @typedef {Object} RelationPlan
 * @property {string} sourceResourceType
 * @property {string} sourceParameter
 * @property {string} targetResourceType
 * @property {string} targetParameter
 * @property {number} depth
 * @property {number} estimatedCost
 */

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} chainParameter
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @returns {{ valid: boolean, reason?: string, relationPlan?: RelationPlan }}
 */
function buildRelationPlan(plan, chainParameter, snapshot) {
    if (!plan.chain || plan.chain.length === 0) {
        return { valid: false, reason: "SearchParameter does not support chaining" };
    }

    const [targetParameter, ...rest] = chainParameter.split(".");
    if (rest.length > 0) {
        return { valid: false, reason: "Recursive chain is not supported in phase one" };
    }

    if (!plan.chain.includes(targetParameter)) {
        return { valid: false, reason: `Undeclared chain parameter: ${targetParameter}` };
    }

    const targetResourceType = plan.target?.[0];
    if (!targetResourceType) {
        return { valid: false, reason: "Missing reference target type" };
    }

    const lookupKey = `${targetResourceType}::${targetParameter}`;
    if (!snapshot.byLookupKey.has(lookupKey)) {
        return { valid: false, reason: `Unknown chained parameter: ${lookupKey}` };
    }

    return {
        valid: true,
        relationPlan: {
            sourceResourceType: plan.resourceType,
            sourceParameter: plan.code,
            targetResourceType,
            targetParameter,
            depth: 1,
            estimatedCost: plan.estimatedCost + 3
        }
    };
}

/**
 * @param {RelationPlan} relationPlan
 * @param {string} value
 * @returns {Object}
 */
function buildRelationAggregation(relationPlan, value) {
    if (relationPlan.depth > MAX_RELATION_DEPTH) {
        throw new Error("Relation depth exceeds allowed limit");
    }
    const { targetResourceType, targetParameter } = relationPlan;
    return {
        isChain: true,
        chain: [
            {
                joinResource: targetResourceType,
                joinParameter: targetParameter,
                value
            }
        ]
    };
}

module.exports = {
    MAX_RELATION_DEPTH,
    buildRelationPlan,
    buildRelationAggregation,
    parseLookupKey
};
