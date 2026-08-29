const {
    loadBuiltinDefinitions,
    loadDatabaseDefinitions,
    fetchDatabaseSearchParameters
} = require("./sourceAdapter");
const { applyActivationOverlay } = require("./activationPolicy");
const { mergeDefinitions } = require("./merge");
const { buildRegistrySnapshot } = require("./snapshot");
const { compileDefinition } = require("../compiler/compiler");
const { createDiagnostic } = require("./diagnostics");

/** @type {import('./types').RegistrySnapshot | null} */
let currentSnapshot = null;
let snapshotVersion = 0;
let reloadPromise = null;

/**
 * @returns {import('./types').RegistrySnapshot | null}
 */
function getSnapshot() {
    return currentSnapshot;
}

/**
 * @param {Object} [options]
 * @param {string} [options.bundlePath]
 * @param {import('./types').SearchParameterResource[]} [options.databaseResources]
 * @returns {Promise<import('./types').RegistrySnapshot>}
 */
async function reloadRegistry(options = {}) {
    if (reloadPromise) {
        return reloadPromise;
    }

    reloadPromise = (async () => {
        const builtin = loadBuiltinDefinitions(options.bundlePath);
        const databaseResources =
            options.databaseResources || (await fetchDatabaseSearchParameters());
        const database = loadDatabaseDefinitions(databaseResources);

        /** @type {import('./types').SearchParameterDefinition[]} */
        const compiledDefinitions = [];
        /** @type {import('./diagnostics').RegistryDiagnostic[]} */
        const diagnostics = [...builtin.diagnostics, ...database.diagnostics];

        for (const definition of [...builtin.definitions, ...database.definitions]) {
            const compileResult = compileDefinition(definition);
            diagnostics.push(...compileResult.diagnostics);
            const activated = applyActivationOverlay(definition, {
                compilable: compileResult.compilable,
                reason: compileResult.reason
            });
            if (compileResult.lookupPlans) {
                activated.lookupPlans = compileResult.lookupPlans;
            }
            compiledDefinitions.push(activated);
        }

        const merged = mergeDefinitions(compiledDefinitions);
        diagnostics.push(...merged.diagnostics);
        snapshotVersion += 1;
        const snapshot = buildRegistrySnapshot({
            definitions: merged.definitions,
            diagnostics,
            version: snapshotVersion
        });
        currentSnapshot = snapshot;
        return snapshot;
    })();

    try {
        return await reloadPromise;
    } catch (error) {
        diagnosticsOnFailure(error);
        if (currentSnapshot) {
            return currentSnapshot;
        }
        throw error;
    } finally {
        reloadPromise = null;
    }
}

/**
 * @param {unknown} error
 */
function diagnosticsOnFailure(error) {
    createDiagnostic({
        code: "reload-failed",
        category: "validation",
        message: error instanceof Error ? error.message : String(error)
    });
}

/**
 * @returns {Promise<import('./types').RegistrySnapshot>}
 */
async function ensureRegistryLoaded() {
    if (currentSnapshot) {
        return currentSnapshot;
    }
    return reloadRegistry();
}

module.exports = {
    getSnapshot,
    reloadRegistry,
    ensureRegistryLoaded
};
