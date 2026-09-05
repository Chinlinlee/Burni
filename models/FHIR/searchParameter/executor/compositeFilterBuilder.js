const _ = require("lodash");
const { buildProjectedFilter } = require("./searchTypeProjection");

/**
 * @typedef {import('./compositeValueParser').ParsedCompositeComponentToken} ParsedCompositeComponentToken
 */

/**
 * @param {string} path
 * @param {*} value
 * @returns {Object}
 */
function nestedPathObject(path, value) {
    const segments = path.split(".").filter(Boolean);
    if (segments.length === 0) {
        return value;
    }
    return segments.reduceRight((current, segment) => ({ [segment]: current }), value);
}

/**
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function deepMergeElemMatchDocument(target, source) {
    for (const [key, value] of Object.entries(source)) {
        if (key.startsWith("$")) {
            if (Array.isArray(target[key]) && Array.isArray(value)) {
                target[key] = [...target[key], ...value];
            } else if (_.isPlainObject(target[key]) && _.isPlainObject(value)) {
                deepMergeElemMatchDocument(target[key], value);
            } else {
                target[key] = value;
            }
            continue;
        }

        if (_.isPlainObject(value) && _.isPlainObject(target[key])) {
            deepMergeElemMatchDocument(target[key], value);
            continue;
        }

        target[key] = value;
    }
    return target;
}

/**
 * @param {Object} filter
 * @param {string} scopePath
 * @returns {Object}
 */
function flattenFilterToElemMatchDocument(filter, scopePath) {
    if (!_.isPlainObject(filter)) {
        return filter;
    }

    if (filter[scopePath] && _.isPlainObject(filter[scopePath]) && filter[scopePath].$elemMatch) {
        return flattenFilterToElemMatchDocument(filter[scopePath].$elemMatch, "");
    }

    const logicalKeys = ["$and", "$or", "$nor"];
    for (const logicalKey of logicalKeys) {
        if (Array.isArray(filter[logicalKey])) {
            return {
                [logicalKey]: filter[logicalKey].map((entry) =>
                    flattenFilterToElemMatchDocument(entry, scopePath)
                )
            };
        }
    }

    /** @type {Object} */
    const document = {};
    for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
            document[key] = value;
            continue;
        }

        let relativePath = key;
        const scopePrefix = `${scopePath}.`;
        if (scopePath && key.startsWith(scopePrefix)) {
            relativePath = key.slice(scopePrefix.length);
        } else if (scopePath && key === scopePath) {
            if (_.isPlainObject(value) && value.$elemMatch) {
                deepMergeElemMatchDocument(document, value.$elemMatch);
            } else {
                deepMergeElemMatchDocument(document, value);
            }
            continue;
        }

        if (relativePath.includes(".")) {
        deepMergeElemMatchDocument(document, { [relativePath]: value });
            continue;
        }

        if (_.isPlainObject(value) && !Array.isArray(value)) {
            document[relativePath] = flattenFilterToElemMatchDocument(value, "");
            continue;
        }

        document[relativePath] = value;
    }

    return document;
}

/**
 * @param {Object} filter
 * @param {string} scopePath
 * @returns {Object[]}
 */
function flattenFilterToElemMatchConditions(filter, scopePath) {
    const flattened = flattenFilterToElemMatchDocument(filter, scopePath);
    if (Array.isArray(flattened.$and)) {
        return flattened.$and;
    }
    return [flattened];
}

/**
 * @param {Object[]} componentFilters
 * @param {string} scopePath
 * @returns {Object}
 */
function buildArrayScopePairFilter(componentFilters, scopePath) {
    const conditions = componentFilters.flatMap((componentFilter) =>
        flattenFilterToElemMatchConditions(componentFilter, scopePath)
    );

    if (conditions.length === 1) {
        return {
            [scopePath]: {
                $elemMatch: conditions[0]
            }
        };
    }

    return {
        [scopePath]: {
            $elemMatch: {
                $and: conditions
            }
        }
    };
}

/**
 * @param {Object[]} componentFilters
 * @returns {Object}
 */
function buildScalarScopePairFilter(componentFilters) {
    if (componentFilters.length === 1) {
        return componentFilters[0];
    }
    return { $and: componentFilters };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {import('./compositePlanTypes').CompositeRootBranch} branch
 * @param {ParsedCompositeComponentToken[]} componentTokens
 * @returns {Object}
 */
function buildBranchPairFilter(plan, branch, componentTokens) {
    const composite = plan.composite;
    if (!composite) {
        throw new Error("Composite search parameter is missing component metadata");
    }

    /** @type {Object[]} */
    const componentFilters = branch.components.map((branchComponent) => {
        const componentDefinition = composite.components[branchComponent.componentIndex];
        if (!componentDefinition) {
            throw new Error("Composite component metadata is incomplete");
        }

        const token = componentTokens[branchComponent.componentIndex];
        const extractionPath = branchComponent.extractionPath;
        const fieldPath =
            branch.correlationMode === "array-element"
                ? extractionPath.path
                : branch.scopePath
                  ? `${branch.scopePath}.${extractionPath.path}`
                  : extractionPath.path;

        return buildProjectedFilter(
            componentDefinition.searchType,
            token.value,
            fieldPath,
            extractionPath.datatype,
            undefined,
            token.comparator,
            extractionPath.referenceTargetType,
            extractionPath.predicates,
            token.temporal,
            extractionPath.arrayPaths
        );
    });

    if (branch.correlationMode === "array-element") {
        return buildArrayScopePairFilter(componentFilters, branch.scopePath);
    }
    return buildScalarScopePairFilter(componentFilters);
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {ParsedCompositeComponentToken[]} componentTokens
 * @returns {Object}
 */
function buildCompositePairFilter(plan, componentTokens) {
    const composite = plan.composite;
    if (!composite?.branches?.length) {
        throw new Error("Composite search parameter is missing executable branches");
    }

    const branchFilters = composite.branches.map((branch) =>
        buildBranchPairFilter(plan, branch, componentTokens)
    );

    if (branchFilters.length === 1) {
        return branchFilters[0];
    }
    return { $or: branchFilters };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {import('./compositeValueParser').ParsedCompositeSearchValue} parsed
 * @returns {Object}
 */
function buildCompositeFilter(plan, parsed) {
    const groupFilters = parsed.groups.map((group) => {
        const pairFilters = group.pairs.map((pair) => {
            const tokens = pair.tokens || [];
            return buildCompositePairFilter(plan, tokens);
        });

        if (pairFilters.length === 1) {
            return pairFilters[0];
        }
        return { $or: pairFilters };
    });

    if (groupFilters.length === 1) {
        return groupFilters[0];
    }
    return {
        [parsed.conjunction === "and" ? "$and" : "$or"]: groupFilters
    };
}

module.exports = {
    buildCompositeFilter,
    buildCompositePairFilter,
    buildBranchPairFilter,
    buildArrayScopePairFilter,
    buildScalarScopePairFilter,
    flattenFilterToElemMatchDocument,
    flattenFilterToElemMatchConditions,
    deepMergeElemMatchDocument
};
