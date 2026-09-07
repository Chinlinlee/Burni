const { parseLookupKey } = require("./identity");

const ABSTRACT_RESOURCE_FALLBACK_CODES = new Set(["_id", "_lastUpdated"]);

/**
 * @param {import('./types').SearchParameterDefinition} definition
 * @param {string} lookupKey
 * @returns {import('../compiler/searchQueryPlan').SearchQueryPlan | null}
 */
function getLookupPlan(definition, lookupKey) {
    const lookupPlan = definition.lookupPlans?.[lookupKey];
    if (lookupPlan?.compilable && lookupPlan.plan) {
        return lookupPlan.plan;
    }
    return null;
}

/**
 * @param {Object} input
 * @param {import('./types').SearchParameterDefinition[]} input.definitions
 * @param {import('./diagnostics').RegistryDiagnostic[]} input.diagnostics
 * @param {number} input.version
 * @returns {import('./types').RegistrySnapshot}
 */
function buildRegistrySnapshot({ definitions, diagnostics, version }) {
    /** @type {Map<string, import('./types').SearchParameterDefinition>} */
    const byCanonicalKey = new Map();
    /** @type {Map<string, import('./types').SearchParameterDefinition>} */
    const byLookupKey = new Map();
    /** @type {Set<string>} */
    const disabledLookupKeys = new Set();
    /** @type {Set<string>} */
    const conflictLookupKeys = new Set();

    for (const definition of definitions) {
        byCanonicalKey.set(definition.canonicalKey, definition);
        for (const lookupKey of definition.lookupKeys) {
            const lookupPlan = getLookupPlan(definition, lookupKey);
            if (definition.effectiveStatus === "active" && lookupPlan) {
                byLookupKey.set(lookupKey, {
                    ...definition,
                    compiledPlan: lookupPlan
                });
            } else if (
                definition.effectiveStatus === "active" &&
                definition.lookupPlans?.[lookupKey] &&
                !definition.lookupPlans[lookupKey].compilable
            ) {
                disabledLookupKeys.add(lookupKey);
            } else if (definition.disableReason?.includes("conflict")) {
                conflictLookupKeys.add(lookupKey);
                disabledLookupKeys.add(lookupKey);
            } else if (definition.effectiveStatus !== "active") {
                disabledLookupKeys.add(lookupKey);
            }
        }
    }

    for (const diagnostic of diagnostics) {
        if (diagnostic.category === "conflict" && diagnostic.lookupKey) {
            conflictLookupKeys.add(diagnostic.lookupKey);
            disabledLookupKeys.add(diagnostic.lookupKey);
            byLookupKey.delete(diagnostic.lookupKey);
        }
    }

    return Object.freeze({
        version,
        loadedAt: Date.now(),
        byCanonicalKey: Object.freeze(byCanonicalKey),
        byLookupKey: Object.freeze(byLookupKey),
        disabledLookupKeys: Object.freeze(disabledLookupKeys),
        conflictLookupKeys: Object.freeze(conflictLookupKeys),
        diagnostics: Object.freeze([...diagnostics])
    });
}

/**
 * @param {import('./types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @param {string} code
 * @returns {'effective' | 'disabled' | 'unknown'}
 */
function resolveLookupStatus(snapshot, resourceType, code) {
    const lookupKeys = [`${resourceType}::${code}`];
    if (resourceType !== "Resource" && ABSTRACT_RESOURCE_FALLBACK_CODES.has(code)) {
        lookupKeys.push(`Resource::${code}`);
    }

    for (const lookupKey of lookupKeys) {
        if (snapshot.byLookupKey.has(lookupKey)) {
            return "effective";
        }
        if (
            snapshot.disabledLookupKeys.has(lookupKey) ||
            snapshot.conflictLookupKeys.has(lookupKey)
        ) {
            return "disabled";
        }
    }
    return "unknown";
}

/**
 * @param {import('./types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @param {string} code
 * @returns {import('./types').SearchParameterDefinition | null}
 */
function getEffectiveDefinition(snapshot, resourceType, code) {
    const lookupKeys = [`${resourceType}::${code}`];
    if (resourceType !== "Resource" && ABSTRACT_RESOURCE_FALLBACK_CODES.has(code)) {
        lookupKeys.push(`Resource::${code}`);
    }

    for (const lookupKey of lookupKeys) {
        if (!snapshot.byLookupKey.has(lookupKey)) {
            if (
                snapshot.disabledLookupKeys.has(lookupKey) ||
                snapshot.conflictLookupKeys.has(lookupKey)
            ) {
                return null;
            }
            continue;
        }

        const definition = snapshot.byLookupKey.get(lookupKey);
        if (!definition) {
            continue;
        }
        if (lookupKey === `${resourceType}::${code}`) {
            return definition;
        }
        return {
            ...definition,
            compiledPlan: {
                ...definition.compiledPlan,
                resourceType
            }
        };
    }

    return null;
}

module.exports = {
    buildRegistrySnapshot,
    resolveLookupStatus,
    getEffectiveDefinition,
    getLookupPlan,
    parseLookupKey
};
