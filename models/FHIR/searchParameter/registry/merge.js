const { createDiagnostic } = require("./diagnostics");

/**
 * @param {import('./types').SearchParameterDefinition[]} definitions
 * @returns {{ definitions: import('./types').SearchParameterDefinition[], diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function mergeDefinitions(definitions) {
    /** @type {Map<string, import('./types').SearchParameterDefinition>} */
    const byCanonical = new Map();
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const definition of definitions) {
        const existing = byCanonical.get(definition.canonicalKey);
        if (!existing) {
            byCanonical.set(definition.canonicalKey, definition);
            continue;
        }

        const merged = definition.source === "database" ? definition : existing;
        byCanonical.set(definition.canonicalKey, {
            ...merged,
            source: definition.source === "database" ? "database" : existing.source,
            diagnostics: [...existing.diagnostics, ...definition.diagnostics]
        });
        diagnostics.push(
            createDiagnostic({
                code: "canonical-overlay",
                category: "conflict",
                message: `Database overlay applied for canonical definition ${definition.canonicalKey}`,
                canonicalKey: definition.canonicalKey,
                source: definition.source
            })
        );
    }

    const mergedDefinitions = [...byCanonical.values()];
    const lookupGroups = buildLookupGroups(mergedDefinitions);
    const conflictLookupKeys = detectLookupConflicts(lookupGroups, diagnostics);

    for (const definition of mergedDefinitions) {
        for (const lookupKey of definition.lookupKeys) {
            if (conflictLookupKeys.has(lookupKey) && definition.effectiveStatus === "active") {
                definition.effectiveStatus = "disabled";
                definition.disableReason = `Active conflict on lookup key ${lookupKey}`;
                definition.diagnostics.push(
                    createDiagnostic({
                        code: "lookup-conflict",
                        category: "conflict",
                        message: definition.disableReason,
                        canonicalKey: definition.canonicalKey,
                        lookupKey,
                        source: definition.source,
                        rawStatus: definition.rawStatus,
                        effectiveStatus: "disabled"
                    })
                );
            }
        }
    }

    return {
        definitions: mergedDefinitions,
        diagnostics
    };
}

/**
 * @param {import('./types').SearchParameterDefinition[]} definitions
 * @returns {Map<string, import('./types').SearchParameterDefinition[]>}
 */
function buildLookupGroups(definitions) {
    /** @type {Map<string, import('./types').SearchParameterDefinition[]>} */
    const groups = new Map();
    for (const definition of definitions) {
        if (definition.effectiveStatus !== "active") {
            continue;
        }
        for (const lookupKey of definition.lookupKeys) {
            const group = groups.get(lookupKey) || [];
            group.push(definition);
            groups.set(lookupKey, group);
        }
    }
    return groups;
}

/**
 * @param {Map<string, import('./types').SearchParameterDefinition[]>} lookupGroups
 * @param {import('./diagnostics').RegistryDiagnostic[]} diagnostics
 * @returns {Set<string>}
 */
function detectLookupConflicts(lookupGroups, diagnostics) {
    /** @type {Set<string>} */
    const conflictLookupKeys = new Set();
    for (const [lookupKey, group] of lookupGroups.entries()) {
        const canonicalKeys = new Set(group.map((definition) => definition.canonicalKey));
        if (canonicalKeys.size <= 1) {
            continue;
        }
        conflictLookupKeys.add(lookupKey);
        diagnostics.push(
            createDiagnostic({
                code: "lookup-conflict",
                category: "conflict",
                message: `Multiple active definitions share lookup key ${lookupKey}`,
                lookupKey,
                canonicalKey: [...canonicalKeys].join(", ")
            })
        );
    }
    return conflictLookupKeys;
}

module.exports = {
    mergeDefinitions
};
