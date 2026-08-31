const { parseLookupKey } = require("../registry/identity");
const { getEffectiveDefinition, resolveLookupStatus } = require("../registry/snapshot");
const { isDeclaredTarget } = require("../registry/referenceMetadata");
const { MAX_QUERY_COST, createTypedFilterPlan } = require("./queryValueParser");

const MAX_RELATION_DEPTH = 1;
const MAX_RELATION_COST = MAX_QUERY_COST;

/**
 * @typedef {Object} RelationPlan
 * @property {string} sourceResourceType
 * @property {string} sourceParameter
 * @property {string[]} targetResourceTypes
 * @property {string} targetParameter
 * @property {string} targetLookupKey
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} sourcePlan
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} targetPlan
 * @property {number} depth
 * @property {number} estimatedCost
 */

/**
 * @param {string} chainParameter
 * @returns {{ targetParameter: string, rest: string[] }}
 */
function splitChainParameter(chainParameter) {
    const [targetParameter, ...rest] = chainParameter.split(".");
    return { targetParameter, rest };
}

/**
 * Official R4 SearchParameter Bundle does not populate `chain`, so a declared
 * target type plus an effective target lookup is the bound for one-level chain.
 * An explicit `chain` list still restricts which target codes are allowed.
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} chainParameter
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {string} [typeFilter]
 * @returns {{ valid: boolean, reason?: string, relationPlan?: RelationPlan }}
 */
function buildRelationPlan(plan, chainParameter, snapshot, typeFilter) {
    if (plan.searchType !== "reference") {
        return { valid: false, reason: "Chaining is only supported on reference search parameters" };
    }

    const { targetParameter, rest } = splitChainParameter(chainParameter);
    if (!targetParameter) {
        return { valid: false, reason: "Missing chained parameter" };
    }
    if (rest.length > 0) {
        return { valid: false, reason: "Recursive chain is not supported" };
    }

    if (plan.chain?.length && !plan.chain.includes(targetParameter.split(":")[0])) {
        return { valid: false, reason: `Undeclared chain parameter: ${targetParameter}` };
    }

    const declaredTargets = plan.targets || plan.target || [];
    if (declaredTargets.length === 0) {
        return { valid: false, reason: "Missing reference target type" };
    }

    if (typeFilter && !isDeclaredTarget(plan, typeFilter)) {
        return { valid: false, reason: `Undeclared reference target: ${typeFilter}` };
    }

    const candidateTargets = typeFilter ? [typeFilter] : declaredTargets;
    /** @type {import('../compiler/searchQueryPlan').SearchQueryPlan | null} */
    let targetPlan = null;
    /** @type {string[]} */
    const matchedTargets = [];

    for (const targetResourceType of candidateTargets) {
        const lookupKey = `${targetResourceType}::${targetParameter.split(":")[0]}`;
        const status = resolveLookupStatus(snapshot, targetResourceType, targetParameter.split(":")[0]);
        if (status === "disabled") {
            return { valid: false, reason: `Chained parameter is disabled: ${lookupKey}` };
        }
        if (status !== "effective") {
            continue;
        }
        const definition = getEffectiveDefinition(
            snapshot,
            targetResourceType,
            targetParameter.split(":")[0]
        );
        if (!definition?.compiledPlan) {
            continue;
        }
        matchedTargets.push(targetResourceType);
        targetPlan = definition.compiledPlan;
    }

    if (!targetPlan || matchedTargets.length === 0) {
        return {
            valid: false,
            reason: `Unknown chained parameter: ${candidateTargets[0]}::${targetParameter.split(":")[0]}`
        };
    }

    const sourceLookupKey = `${plan.resourceType}::${plan.code}`;
    const targetLookupKey = `${matchedTargets[0]}::${targetPlan.code}`;
    if (sourceLookupKey === targetLookupKey) {
        return { valid: false, reason: "Relation cycle is not allowed" };
    }

    const estimatedCost = plan.estimatedCost + targetPlan.estimatedCost + 3;
    if (estimatedCost > MAX_RELATION_COST) {
        return { valid: false, reason: "Relation cost exceeds allowed limit" };
    }

    return {
        valid: true,
        relationPlan: {
            sourceResourceType: plan.resourceType,
            sourceParameter: plan.code,
            targetResourceTypes: matchedTargets,
            targetParameter,
            targetLookupKey,
            sourcePlan: plan,
            targetPlan,
            depth: 1,
            estimatedCost
        }
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {Object[]}
 */
function unwindStagesForPath(extractionPath) {
    const segments = extractionPath.path.split(".");
    /** @type {Object[]} */
    const stages = [];
    let current = "";
    for (const segment of segments) {
        current = current ? `${current}.${segment}` : segment;
        stages.push({
            $unwind: {
                path: `$${current}`,
                preserveNullAndEmptyArrays: true
            }
        });
    }
    return stages;
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {Object[]}
 */
function correlationMatchStages(extractionPath) {
    const predicates = extractionPath.predicates || [];
    const parentPath = extractionPath.correlation?.parentPath || extractionPath.path.split(".")[0];
    /** @type {Object[]} */
    const stages = [];
    for (const predicate of predicates) {
        if (predicate.kind === "typeEquals" && predicate.value) {
            stages.push({ $match: { [`${parentPath}.type`]: predicate.value } });
        }
        if (predicate.kind === "systemEquals" && predicate.value) {
            stages.push({ $match: { [`${parentPath}.system`]: predicate.value } });
        }
    }
    return stages;
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string}
 */
function referenceValueExpression(extractionPath) {
    if (extractionPath.datatype === "Reference") {
        return `$${extractionPath.path}.reference`;
    }
    return `$${extractionPath.path}`;
}

/**
 * @param {RelationPlan} relationPlan
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @returns {Object}
 */
function buildRelationAggregation(relationPlan, value) {
    if (relationPlan.depth > MAX_RELATION_DEPTH) {
        throw new Error("Relation depth exceeds allowed limit");
    }
    if (relationPlan.estimatedCost > MAX_RELATION_COST) {
        throw new Error("Relation cost exceeds allowed limit");
    }

    const targetFilterPlan =
        value &&
        typeof value === "object" &&
        (value.kind === "temporal-filter-plan" || value.kind === "typed-filter-plan") &&
        value.searchPlan
            ? value
            : createTypedFilterPlan(
                  relationPlan.targetPlan,
                  value,
                  relationPlan.targetParameter
              );
    if (targetFilterPlan.searchPlan !== relationPlan.targetPlan) {
        throw new Error("Typed filter plan does not belong to chained target plan");
    }
    const targetFilter = targetFilterPlan.filter;
    const aliases = [];
    /** @type {Object[]} */
    const pipeline = [];
    let aliasIndex = 0;

    for (const extractionPath of relationPlan.sourcePlan.extractionPaths) {
        if (extractionPath.datatype === "Resource") {
            continue;
        }
        for (const targetResourceType of relationPlan.targetResourceTypes) {
            const alias = `__chain_${aliasIndex}`;
            aliasIndex += 1;
            aliases.push(alias);
            pipeline.push(...unwindStagesForPath(extractionPath));
            pipeline.push(...correlationMatchStages(extractionPath));
            pipeline.push({
                $lookup: {
                    from: targetResourceType,
                    let: {
                        refValue: referenceValueExpression(extractionPath)
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$id",
                                        {
                                            $arrayElemAt: [{ $split: ["$$refValue", "/"] }, -1]
                                        }
                                    ]
                                }
                            }
                        },
                        { $match: targetFilter }
                    ],
                    as: alias
                }
            });
        }
    }

    if (aliases.length === 0) {
        throw new Error("Relation plan has no executable reference extraction path");
    }

    pipeline.push({
        $match: {
            $or: aliases.map((alias) => ({
                [`${alias}.0`]: { $exists: true }
            }))
        }
    });

    return {
        isChain: true,
        chain: [pipeline],
        filterPlan: targetFilterPlan
    };
}

module.exports = {
    MAX_RELATION_DEPTH,
    MAX_RELATION_COST,
    buildRelationPlan,
    buildRelationAggregation,
    parseLookupKey
};
