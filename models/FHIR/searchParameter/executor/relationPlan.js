const fhirResourceCatalog = require("../../fhir.resourceList.json");
const { getEffectiveDefinition, resolveLookupStatus } = require("../registry/snapshot");
const { createTypedFilterPlan } = require("./queryValueParser");

const MAX_RELATION_DEPTH = 3;
const MAX_RELATION_COST = 24;

/**
 * @typedef {Object} RelationBranch
 * @property {string} sourceResourceType
 * @property {string} targetResourceType
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} targetPlan
 */

/**
 * @typedef {Object} RelationHop
 * @property {string} code
 * @property {string} [typeFilter]
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} sourcePlan
 * @property {RelationBranch[]} branches
 */

/**
 * @typedef {Object} RelationPath
 * @property {RelationHop[]} hops
 * @property {{ code: string, modifier?: string }} terminal
 * @property {number} depth
 * @property {number} estimatedCost
 * @property {string} sourceResourceType
 * @property {string} sourceParameter
 */

/**
 * @param {string[]} declaredTargets
 * @returns {boolean}
 */
function isOpenReferenceTarget(declaredTargets) {
    if (!declaredTargets || declaredTargets.length === 0) {
        return true;
    }
    if (declaredTargets.includes("Resource")) {
        return true;
    }
    let missing = 0;
    for (const resourceType of fhirResourceCatalog) {
        if (!declaredTargets.includes(resourceType)) {
            missing += 1;
        }
    }
    return missing <= 1;
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} referencePlan
 * @param {string | undefined} typeFilter
 * @returns {string[]}
 */
function candidateTargetTypes(referencePlan, typeFilter) {
    const declaredTargets = referencePlan.targets || referencePlan.target || [];
    if (typeFilter) {
        return [typeFilter];
    }
    return declaredTargets;
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} referencePlan
 * @param {string | undefined} typeFilter
 * @returns {{ ok: true } | { ok: false, class: "missing-type-filter" | "unknown" }}
 */
function validateOpenHop(referencePlan, typeFilter) {
    const declaredTargets = referencePlan.targets || referencePlan.target || [];
    if (!isOpenReferenceTarget(declaredTargets)) {
        return { ok: true };
    }
    if (!typeFilter) {
        return { ok: false, class: "missing-type-filter" };
    }
    if (declaredTargets.length === 0 || declaredTargets.includes("Resource")) {
        return { ok: true };
    }
    if (!declaredTargets.includes(typeFilter)) {
        return { ok: false, class: "unknown" };
    }
    return { ok: true };
}

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} referencePlan
 * @param {string} nextCode
 * @param {string} sourceResourceType
 * @param {string | undefined} typeFilter
 * @returns {{ branches: RelationBranch[], failed: boolean }}
 */
function resolveReferenceBranches(snapshot, referencePlan, nextCode, sourceResourceType, typeFilter) {
    if (referencePlan.chain?.length && !referencePlan.chain.includes(nextCode)) {
        return { branches: [], failed: true };
    }

    const declaredTargets = referencePlan.targets || referencePlan.target || [];
    const open = isOpenReferenceTarget(declaredTargets);
    const candidates = candidateTargetTypes(referencePlan, typeFilter);

    if (!open && typeFilter && !declaredTargets.includes(typeFilter)) {
        return { branches: [], failed: true };
    }

    /** @type {RelationBranch[]} */
    const branches = [];

    for (const targetResourceType of candidates) {
        const status = resolveLookupStatus(snapshot, targetResourceType, nextCode);
        if (status === "disabled") {
            return { branches: [], failed: true };
        }
        if (status !== "effective") {
            continue;
        }
        const definition = getEffectiveDefinition(snapshot, targetResourceType, nextCode);
        if (!definition?.compiledPlan) {
            continue;
        }
        branches.push({
            sourceResourceType,
            targetResourceType,
            targetPlan: definition.compiledPlan
        });
    }

    return { branches, failed: false };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {import('../runtime/parameterName').ParsedSearchParameterName} parsedName
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @returns {{ valid: true, relationPlan: RelationPath } | { valid: false, class: string }}
 */
function buildRelationPlan(plan, parsedName, snapshot) {
    if (plan.searchType !== "reference") {
        return { valid: false, class: "unknown" };
    }

    const { hops, terminal } = parsedName;
    if (!terminal?.code || !hops?.length) {
        return { valid: false, class: "unknown" };
    }

    // Hop 0 is already resolved as `plan`; check it before depth so a 4-dot
    // open chain missing `:Type` is missing-type-filter, not relation-depth.
    const firstOpenCheck = validateOpenHop(plan, hops[0].typeFilter);
    if (!firstOpenCheck.ok) {
        return { valid: false, class: firstOpenCheck.class };
    }

    if (hops.length > MAX_RELATION_DEPTH) {
        return { valid: false, class: "relation-depth" };
    }

    /** @type {RelationHop[]} */
    const relationHops = [];
    /** @type {RelationBranch[] | null} */
    let currentBranches = null;
    let estimatedCost = 0;

    for (let hopIndex = 0; hopIndex < hops.length; hopIndex += 1) {
        const hop = hops[hopIndex];
        const nextCode = hops[hopIndex + 1]?.code ?? terminal.code;
        /** @type {RelationBranch[]} */
        const hopBranches = [];

        if (hopIndex === 0) {
            const openCheck = validateOpenHop(plan, hop.typeFilter);
            if (!openCheck.ok) {
                return { valid: false, class: openCheck.class };
            }
            const { branches, failed } = resolveReferenceBranches(
                snapshot,
                plan,
                nextCode,
                plan.resourceType,
                hop.typeFilter
            );
            if (failed) {
                return { valid: false, class: "unknown" };
            }
            hopBranches.push(...branches);
        } else {
            for (const incoming of currentBranches) {
                const referencePlan = incoming.targetPlan;
                if (referencePlan.searchType !== "reference") {
                    return { valid: false, class: "unknown" };
                }
                const openCheck = validateOpenHop(referencePlan, hop.typeFilter);
                if (!openCheck.ok) {
                    return { valid: false, class: openCheck.class };
                }
                const { branches, failed } = resolveReferenceBranches(
                    snapshot,
                    referencePlan,
                    nextCode,
                    incoming.targetResourceType,
                    hop.typeFilter
                );
                if (failed) {
                    return { valid: false, class: "unknown" };
                }
                hopBranches.push(...branches);
            }
        }

        if (hopBranches.length === 0) {
            return { valid: false, class: "unknown" };
        }

        for (const branch of hopBranches) {
            estimatedCost += 3 + branch.targetPlan.estimatedCost;
        }

        relationHops.push({
            code: hop.code,
            typeFilter: hop.typeFilter,
            sourcePlan: hopIndex === 0 ? plan : currentBranches[0].targetPlan,
            branches: hopBranches
        });
        currentBranches = hopBranches;
    }

    if (estimatedCost > MAX_RELATION_COST) {
        return { valid: false, class: "relation-cost" };
    }

    return {
        valid: true,
        relationPlan: {
            hops: relationHops,
            terminal,
            depth: hops.length,
            estimatedCost,
            sourceResourceType: plan.resourceType,
            sourceParameter: plan.code
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
 * @param {unknown} value
 * @returns {value is import('./queryValueParser').TypedFilterPlan}
 */
function isTypedFilterPlan(value) {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        (value.kind === "temporal-filter-plan" || value.kind === "typed-filter-plan") &&
        Boolean(value.searchPlan)
    );
}

/**
 * @param {RelationPath} relationPlan
 * @returns {string}
 */
function terminalParameterName(relationPlan) {
    return relationPlan.terminal.modifier
        ? `${relationPlan.terminal.code}:${relationPlan.terminal.modifier}`
        : relationPlan.terminal.code;
}

/**
 * @returns {Object}
 */
function idCorrelationStage() {
    return {
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
    };
}

/**
 * @param {string[]} aliases
 * @returns {Object}
 */
function matchNothingStage() {
    return {
        $match: {
            __chainNoExecutablePath: { $exists: true },
            __chainNoExecutablePath2: { $exists: false }
        }
    };
}

/**
 * @param {string[]} aliases
 * @returns {Object}
 */
function existenceMatchStage(aliases) {
    if (aliases.length === 0) {
        return matchNothingStage();
    }
    return {
        $match: {
            $or: aliases.map((alias) => ({
                [`${alias}.0`]: { $exists: true }
            }))
        }
    };
}

/**
 * @param {RelationBranch} branch
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @param {string} terminalParameter
 * @returns {import('./queryValueParser').TypedFilterPlan}
 */
function resolveTerminalFilterPlan(branch, value, terminalParameter) {
    if (isTypedFilterPlan(value)) {
        if (branch.targetPlan === value.searchPlan) {
            return value;
        }
        return createTypedFilterPlan(branch.targetPlan, value.rawValue, terminalParameter);
    }
    return createTypedFilterPlan(branch.targetPlan, value, terminalParameter);
}

/**
 * @param {number} hopIndex
 * @param {RelationBranch} branch
 * @param {RelationPath} relationPlan
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @param {{ counter: number }} aliasCounter
 * @returns {{ stages: Object[], filterPlan?: import('./queryValueParser').TypedFilterPlan }}
 */
function buildBranchLookupPipeline(hopIndex, branch, relationPlan, value, aliasCounter) {
    const hops = relationPlan.hops;
    const isNaturalTerminal = hopIndex >= hops.length - 1;
    const isTerminalHop = isNaturalTerminal || hopIndex >= MAX_RELATION_DEPTH - 1;
    const terminalParameter = terminalParameterName(relationPlan);
    /** @type {Object[]} */
    const stages = [idCorrelationStage()];

    if (isTerminalHop) {
        if (isNaturalTerminal) {
            const filterPlan = resolveTerminalFilterPlan(branch, value, terminalParameter);
            stages.push({ $match: filterPlan.filter });
            return { stages, filterPlan };
        }
        return { stages };
    }

    const nextHop = hops[hopIndex + 1];
    const referencePlan = branch.targetPlan;
    const nextBranches = nextHop.branches.filter(
        (nextBranch) => nextBranch.sourceResourceType === branch.targetResourceType
    );
    const aliases = [];
    /** @type {import('./queryValueParser').TypedFilterPlan | undefined} */
    let retainedFilterPlan;

    for (const extractionPath of referencePlan.extractionPaths) {
        if (extractionPath.datatype === "Resource") {
            continue;
        }
        for (const nextBranch of nextBranches) {
            const alias = `__chain_${aliasCounter.counter}`;
            aliasCounter.counter += 1;
            aliases.push(alias);
            const nested = buildBranchLookupPipeline(
                hopIndex + 1,
                nextBranch,
                relationPlan,
                value,
                aliasCounter
            );
            if (!retainedFilterPlan && nested.filterPlan) {
                retainedFilterPlan = nested.filterPlan;
            }
            stages.push(...unwindStagesForPath(extractionPath));
            stages.push(...correlationMatchStages(extractionPath));
            stages.push({
                $lookup: {
                    from: nextBranch.targetResourceType,
                    let: {
                        refValue: referenceValueExpression(extractionPath)
                    },
                    pipeline: nested.stages,
                    as: alias
                }
            });
        }
    }

    if (aliases.length === 0) {
        stages.push(matchNothingStage());
    } else {
        stages.push(existenceMatchStage(aliases));
    }

    return { stages, filterPlan: retainedFilterPlan };
}

/**
 * @param {RelationPath} relationPlan
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @returns {Object}
 */
function buildRelationAggregation(relationPlan, value) {
    const firstHop = relationPlan.hops[0];
    const terminalParameter = terminalParameterName(relationPlan);
    const aliases = [];
    /** @type {Object[]} */
    const pipeline = [];
    const aliasCounter = { counter: 0 };
    /** @type {import('./queryValueParser').TypedFilterPlan | undefined} */
    let returnedFilterPlan = isTypedFilterPlan(value) ? value : undefined;

    for (const extractionPath of firstHop.sourcePlan.extractionPaths) {
        if (extractionPath.datatype === "Resource") {
            continue;
        }
        for (const branch of firstHop.branches) {
            const alias = `__chain_${aliasCounter.counter}`;
            aliasCounter.counter += 1;
            aliases.push(alias);
            const nested = buildBranchLookupPipeline(
                0,
                branch,
                relationPlan,
                value,
                aliasCounter
            );
            if (!returnedFilterPlan && nested.filterPlan) {
                returnedFilterPlan = nested.filterPlan;
            }
            pipeline.push(...unwindStagesForPath(extractionPath));
            pipeline.push(...correlationMatchStages(extractionPath));
            pipeline.push({
                $lookup: {
                    from: branch.targetResourceType,
                    let: {
                        refValue: referenceValueExpression(extractionPath)
                    },
                    pipeline: nested.stages,
                    as: alias
                }
            });
        }
    }

    if (aliases.length === 0) {
        pipeline.push(matchNothingStage());
    } else {
        pipeline.push(existenceMatchStage(aliases));
    }

    if (!returnedFilterPlan) {
        const lastHop = relationPlan.hops[relationPlan.hops.length - 1];
        const fallbackBranch = lastHop.branches[0];
        if (fallbackBranch) {
            returnedFilterPlan = resolveTerminalFilterPlan(
                fallbackBranch,
                value,
                terminalParameter
            );
        }
    }

    return {
        isChain: true,
        chain: [pipeline],
        filterPlan: returnedFilterPlan
    };
}

module.exports = {
    MAX_RELATION_DEPTH,
    MAX_RELATION_COST,
    isOpenReferenceTarget,
    buildRelationPlan,
    buildRelationAggregation
};
