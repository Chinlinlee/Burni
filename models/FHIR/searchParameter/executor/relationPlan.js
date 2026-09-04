const fhirResourceCatalog = require("../../fhir.resourceList.json");
const { prefixPlanExtractionPaths } = require("../compiler/bundleInlineMetadata");
const { bundleInlineGatingConditions } = require("./bundleInlineDirectFilter");
const { getEffectiveDefinition, resolveLookupStatus } = require("../registry/snapshot");
const { createTypedFilterPlan } = require("./queryValueParser");

const MAX_RELATION_DEPTH = 3;
const MAX_RELATION_COST = 24;
const BUNDLE_INLINE_SCALAR_RESOURCE_FIELD = "__bundleInlineResource";

/**
 * @returns {Object}
 */
function bundleInlineScalarResourceProjectionStage() {
    return {
        $addFields: {
            // Materialize entry[0] because aggregation expressions treat $entry.0 as array-valued.
            [BUNDLE_INLINE_SCALAR_RESOURCE_FIELD]: {
                $getField: {
                    field: "resource",
                    input: { $arrayElemAt: ["$entry", 0] }
                }
            }
        }
    };
}

/**
 * @param {string} path
 * @param {string} inlinePath
 * @returns {string}
 */
function toInlineAggregationPath(path, inlinePath) {
    if (path === inlinePath) {
        return BUNDLE_INLINE_SCALAR_RESOURCE_FIELD;
    }
    if (path.startsWith(`${inlinePath}.`)) {
        return `${BUNDLE_INLINE_SCALAR_RESOURCE_FIELD}.${path.slice(inlinePath.length + 1)}`;
    }
    return path;
}

/**
 * @typedef {Object} RelationBranch
 * @property {string} sourceResourceType
 * @property {string} targetResourceType
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} targetPlan
 */

/**
 * @typedef {Object} RelationInlineHop
 * @property {'embedded'} mode
 * @property {string} inlinePath
 * @property {string} targetResourceType
 * @property {string} bundleTypePredicate
 */

/**
 * @typedef {Object} RelationHop
 * @property {string} code
 * @property {string} [typeFilter]
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan} sourcePlan
 * @property {RelationBranch[]} branches
 * @property {RelationInlineHop} [inline]
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
            branches: hopBranches,
            inline:
                hopIndex === 0 && plan.inlineTarget
                    ? {
                              mode: plan.inlineTarget.mode,
                          inlinePath: plan.inlineTarget.inlinePath,
                          targetResourceType: plan.inlineTarget.targetResourceType,
                          bundleTypePredicate: plan.inlineTarget.bundleTypePredicate
                      }
                    : undefined
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
 * @param {string} [inlinePath]
 * @returns {Object[]}
 */
function correlationMatchStages(extractionPath, inlinePath) {
    const predicates = extractionPath.predicates || [];
    const sourceParentPath =
        extractionPath.correlation?.parentPath || extractionPath.path.split(".")[0];
    const parentPath = inlinePath
        ? toInlineAggregationPath(sourceParentPath, inlinePath)
        : sourceParentPath;
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
 * @param {string} [inlinePath]
 * @returns {string}
 */
function referenceValueExpression(extractionPath, inlinePath) {
    const path = inlinePath
        ? toInlineAggregationPath(extractionPath.path, inlinePath)
        : extractionPath.path;
    if (extractionPath.datatype === "Reference") {
        return `$${path}.reference`;
    }
    return `$${path}`;
}

/**
 * @param {Object} filter
 * @param {string} prefix
 * @returns {Object}
 */
function prefixMongoFilterPaths(filter, prefix) {
    if (Array.isArray(filter)) {
        return filter.map((item) => prefixMongoFilterPaths(item, prefix));
    }
    if (!filter || typeof filter !== "object") {
        return filter;
    }

    /** @type {Object} */
    const prefixed = {};
    for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
            if (Array.isArray(value)) {
                prefixed[key] = value.map((item) => prefixMongoFilterPaths(item, prefix));
            } else if (key === "$not" && value && typeof value === "object") {
                prefixed[key] = prefixMongoFilterPaths(value, prefix);
            } else {
                prefixed[key] = value;
            }
            continue;
        }
        prefixed[`${prefix}.${key}`] = value;
    }
    return prefixed;
}

/**
 * @param {string} alias
 * @param {string} targetResourceType
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @param {string} inlinePath
 * @returns {Object}
 */
function localInlineTargetStage(alias, targetResourceType, extractionPath, inlinePath) {
    const referenceValue = referenceValueExpression(extractionPath, inlinePath);
    const referenceId = {
        $arrayElemAt: [
            {
                $split: [
                    {
                        $ifNull: [referenceValue, ""]
                    },
                    "/"
                ]
            },
            -1
        ]
    };
    return {
        $addFields: {
            [alias]: {
                $filter: {
                    input: { $ifNull: ["$entry", []] },
                    as: "bundleEntry",
                    cond: {
                        $and: [
                            {
                                $eq: [
                                    "$$bundleEntry.resource.resourceType",
                                    targetResourceType
                                ]
                            },
                            {
                                $or: [
                                    { $eq: ["$$bundleEntry.resource.id", referenceId] },
                                    { $eq: ["$$bundleEntry.fullUrl", referenceValue] }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    };
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
 * @param {RelationBranch} branch
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} embeddedPlan
 * @param {number} hopIndex
 * @param {RelationPath} relationPlan
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @param {{ counter: number }} aliasCounter
 * @returns {{
 *   stages: Object[],
 *   filterPlan?: import('./queryValueParser').TypedFilterPlan,
 *   lookupAliases?: string[],
 *   matchConditions?: Object[]
 * }}
 */
function buildInlineEmbeddedHopStages(
    branch,
    embeddedPlan,
    hopIndex,
    relationPlan,
    value,
    aliasCounter
) {
    const hops = relationPlan.hops;
    const isNaturalTerminal = hopIndex >= hops.length - 1;
    const isNextBranchTerminal = hopIndex + 1 >= hops.length - 1;
    const isTerminalHop = isNaturalTerminal || hopIndex >= MAX_RELATION_DEPTH - 1;
    const terminalParameter = terminalParameterName(relationPlan);
    /** @type {Object[]} */
    const stages = [];
    /** @type {string[]} */
    const lookupAliases = [];
    /** @type {Object[]} */
    const matchConditions = [];
    /** @type {import('./queryValueParser').TypedFilterPlan | undefined} */
    let retainedFilterPlan;

    if (isTerminalHop) {
        if (isNaturalTerminal) {
            const filterPlan = resolveTerminalFilterPlan(
                { ...branch, targetPlan: embeddedPlan },
                value,
                terminalParameter
            );
            stages.push({ $match: filterPlan.filter });
            return { stages, filterPlan };
        }
        return { stages };
    }

    const nextHop = hops[hopIndex + 1];
    const referencePlan = embeddedPlan;
    const nextBranches = nextHop.branches.filter(
        (nextBranch) => nextBranch.sourceResourceType === branch.targetResourceType
    );

    for (const extractionPath of referencePlan.extractionPaths) {
        if (extractionPath.datatype === "Resource") {
            continue;
        }
        for (const nextBranch of nextBranches) {
            const alias = `__chain_${aliasCounter.counter}`;
            aliasCounter.counter += 1;
            lookupAliases.push(alias);
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
            const inlinePath = relationPlan.hops[0].inline.inlinePath;
            let localAlias;
            if (isNextBranchTerminal && nested.filterPlan) {
                localAlias = `__bundleInlineTarget_${aliasCounter.counter}`;
                aliasCounter.counter += 1;
                stages.push(
                    localInlineTargetStage(
                        localAlias,
                        nextBranch.targetResourceType,
                        extractionPath,
                        inlinePath
                    )
                );
            }
            stages.push(...unwindStagesForInlinePath(extractionPath, inlinePath));
            stages.push(...correlationMatchStages(extractionPath, inlinePath));
            stages.push({
                $lookup: {
                    from: nextBranch.targetResourceType,
                    let: {
                        refValue: referenceValueExpression(extractionPath, inlinePath)
                    },
                    pipeline: nested.stages,
                    as: alias
                }
            });
            if (localAlias && nested.filterPlan) {
                matchConditions.push({
                    $or: [
                        {
                            $and: [
                                { [`${localAlias}.0`]: { $exists: true } },
                                prefixMongoFilterPaths(
                                    nested.filterPlan.filter,
                                    `${localAlias}.resource`
                                )
                            ]
                        },
                        {
                            $and: [
                                { [`${localAlias}.0`]: { $exists: false } },
                                { [`${alias}.0`]: { $exists: true } }
                            ]
                        }
                    ]
                });
            } else {
                matchConditions.push({
                    [`${alias}.0`]: { $exists: true }
                });
            }
        }
    }

    if (lookupAliases.length === 0) {
        stages.push(matchNothingStage());
    }

    return { stages, filterPlan: retainedFilterPlan, lookupAliases, matchConditions };
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @param {string} inlinePath
 * @returns {Object[]}
 */
function unwindStagesForInlinePath(extractionPath, inlinePath) {
    const aggregationPath = toInlineAggregationPath(extractionPath.path, inlinePath);
    const relativeSegments = aggregationPath
        .slice(`${BUNDLE_INLINE_SCALAR_RESOURCE_FIELD}.`.length)
        .split(".");
    /** @type {Object[]} */
    const stages = [];
    let current = BUNDLE_INLINE_SCALAR_RESOURCE_FIELD;
    for (const segment of relativeSegments) {
        current = `${current}.${segment}`;
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
 * @param {RelationPath} relationPlan
 * @param {string | string[] | import('./queryValueParser').TypedFilterPlan} value
 * @param {{ counter: number }} aliasCounter
 * @returns {{ pipeline: Object[], filterPlan?: import('./queryValueParser').TypedFilterPlan }}
 */
function buildInlineFirstHopAggregation(relationPlan, value, aliasCounter) {
    const firstHop = relationPlan.hops[0];
    const terminalParameter = terminalParameterName(relationPlan);
    /** @type {Object[]} */
    const pipeline = [];
    /** @type {string[]} */
    const aliases = [];
    /** @type {Object[]} */
    const matchConditions = [];
    /** @type {import('./queryValueParser').TypedFilterPlan | undefined} */
    let returnedFilterPlan = isTypedFilterPlan(value) ? value : undefined;

    if (firstHop.inline) {
        pipeline.push({
            $match: { $and: bundleInlineGatingConditions(firstHop.inline) }
        });
        pipeline.push(bundleInlineScalarResourceProjectionStage());
    }

    for (const branch of firstHop.branches) {
        const embeddedPlan = prefixPlanExtractionPaths(
            branch.targetPlan,
            firstHop.inline.inlinePath
        );
        const hopStages = buildInlineEmbeddedHopStages(
            branch,
            embeddedPlan,
            0,
            relationPlan,
            value,
            aliasCounter
        );
        if (!returnedFilterPlan && hopStages.filterPlan) {
            returnedFilterPlan = hopStages.filterPlan;
        }
        if (hopStages.lookupAliases?.length) {
            pipeline.push(...hopStages.stages);
            aliases.push(...hopStages.lookupAliases);
            matchConditions.push(...(hopStages.matchConditions || []));
            continue;
        }
        pipeline.push(...hopStages.stages);
        matchConditions.push(...(hopStages.matchConditions || []));
    }

    if (matchConditions.length > 0) {
        pipeline.push({ $match: { $or: matchConditions } });
    } else if (aliases.length > 0) {
        pipeline.push(existenceMatchStage(aliases));
    } else if (
        pipeline.length === 0 ||
        pipeline.every((stage) => stage.$match?.__chainNoExecutablePath)
    ) {
        pipeline.push(matchNothingStage());
    }

    if (!returnedFilterPlan) {
        const lastHop = relationPlan.hops[relationPlan.hops.length - 1];
        const fallbackBranch = lastHop.branches[0];
        if (fallbackBranch) {
            const embeddedFallbackPlan = firstHop.inline
                ? prefixPlanExtractionPaths(
                      fallbackBranch.targetPlan,
                      firstHop.inline.inlinePath
                  )
                : fallbackBranch.targetPlan;
            returnedFilterPlan = resolveTerminalFilterPlan(
                { ...fallbackBranch, targetPlan: embeddedFallbackPlan },
                value,
                terminalParameter
            );
        }
    }

    return { pipeline, filterPlan: returnedFilterPlan };
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

    if (firstHop.inline) {
        const inlineAggregation = buildInlineFirstHopAggregation(relationPlan, value, aliasCounter);
        return {
            isChain: true,
            chain: [inlineAggregation.pipeline],
            filterPlan: inlineAggregation.filterPlan
        };
    }

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
    BUNDLE_INLINE_SCALAR_RESOURCE_FIELD,
    isOpenReferenceTarget,
    buildRelationPlan,
    buildRelationAggregation
};
