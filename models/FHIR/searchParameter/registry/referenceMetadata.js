const { getEffectiveDefinition, resolveLookupStatus } = require("./snapshot");

/**
 * @param {import('./types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @param {string} code
 * @returns {{
 *   plan: import('../compiler/searchQueryPlan').SearchQueryPlan,
 *   targets: string[],
 *   extractionPaths: import('../compiler/searchQueryPlan').ExtractionPath[],
 *   supportedValueForms: string[]
 * } | null}
 */
function getReferenceLookup(snapshot, resourceType, code) {
    const definition = getEffectiveDefinition(snapshot, resourceType, code);
    const plan = definition?.compiledPlan;
    if (!plan || plan.searchType !== "reference") {
        return null;
    }
    return {
        plan,
        targets: plan.targets || plan.target || [],
        extractionPaths: plan.extractionPaths,
        supportedValueForms: plan.supportedValueForms || []
    };
}

/**
 * @param {import('./types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @returns {string[]}
 */
function listReferenceLookups(snapshot, resourceType) {
    const prefix = `${resourceType}::`;
    const codes = [];
    for (const [lookupKey, definition] of snapshot.byLookupKey) {
        if (!lookupKey.startsWith(prefix)) {
            continue;
        }
        if (definition.compiledPlan?.searchType === "reference") {
            codes.push(definition.compiledPlan.code);
        }
    }
    return codes.sort();
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} targetType
 * @returns {boolean}
 */
function isDeclaredTarget(plan, targetType) {
    if (!targetType) {
        return true;
    }
    const targets = plan.targets || plan.target || [];
    if (targets.length === 0) {
        return true;
    }
    return targets.includes(targetType);
}

/**
 * @param {import('./types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @param {string} code
 * @returns {boolean}
 */
function isReferenceLookup(snapshot, resourceType, code) {
    if (code === "*") {
        return listReferenceLookups(snapshot, resourceType).length > 0;
    }
    if (resolveLookupStatus(snapshot, resourceType, code) !== "effective") {
        return false;
    }
    return Boolean(getReferenceLookup(snapshot, resourceType, code));
}

module.exports = {
    getReferenceLookup,
    listReferenceLookups,
    isDeclaredTarget,
    isReferenceLookup
};
