const {
    loadBuiltinDefinitions,
    loadDatabaseDefinitions,
    fetchDatabaseSearchParameters
} = require("./sourceAdapter");
const { applyActivationOverlay } = require("./activationPolicy");
const { mergeDefinitions } = require("./merge");
const { buildRegistrySnapshot } = require("./snapshot");
const compiler = require("../compiler/compiler");
const { createDiagnostic } = require("./diagnostics");
const compiledArtifact = require("./artifacts/compiledArtifact");
const artifactIdentity = require("./artifacts/artifactIdentity");

/** @type {import('./types').RegistrySnapshot | null} */
let currentSnapshot = null;
let snapshotVersion = 0;
let reloadPromise = null;

/** @type {import('./artifacts/compiledArtifact').CompiledArtifactDefinitionEntry[] | null} */
let cachedBuiltinArtifactEntries = null;
/** @type {import('./artifacts/artifactIdentity').ArtifactIdentity | null} */
let cachedArtifactIdentity = null;

/**
 * @returns {import('./types').RegistrySnapshot | null}
 */
function getSnapshot() {
    return currentSnapshot;
}

/**
 * @param {import('./artifacts/artifactIdentity').ArtifactIdentity} expectedIdentity
 * @returns {{ valid: boolean, errors: string[] }}
 */
function verifyCachedArtifactIdentity(expectedIdentity) {
    const errors = [];
    const currentIdentity = artifactIdentity.computeCurrentIdentity();

    if (
        !expectedIdentity.bundleChecksum ||
        expectedIdentity.bundleChecksum !== currentIdentity.bundleChecksum
    ) {
        errors.push(
            "SearchParameter bundle checksum mismatch. Run npm run search-parameter:build-artifacts to regenerate the compile artifact."
        );
    }
    if (
        !expectedIdentity.compilerDirectoryHash ||
        expectedIdentity.compilerDirectoryHash !== currentIdentity.compilerDirectoryHash
    ) {
        errors.push(
            "SearchParameter compiler directory hash mismatch. Run npm run search-parameter:build-artifacts to regenerate the compile artifact."
        );
    }
    if (
        !expectedIdentity.typeMapsDirectoryHash ||
        expectedIdentity.typeMapsDirectoryHash !== currentIdentity.typeMapsDirectoryHash
    ) {
        errors.push(
            "SearchParameter type maps directory hash mismatch. Run npm run search-parameter:build-artifacts to regenerate the compile artifact."
        );
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @returns {import('./artifacts/compiledArtifact').CompiledArtifactDefinitionEntry[]}
 */
function loadBuiltinArtifactEntries() {
    if (cachedBuiltinArtifactEntries && cachedArtifactIdentity) {
        const verification = verifyCachedArtifactIdentity(cachedArtifactIdentity);
        if (!verification.valid) {
            throw new Error(verification.errors.join("; "));
        }
        return cachedBuiltinArtifactEntries;
    }

    const artifact = compiledArtifact.readArtifact();
    const verification = compiledArtifact.verifyArtifactIdentity(artifact);
    if (!verification.valid) {
        throw new Error(verification.errors.join("; "));
    }

    cachedBuiltinArtifactEntries = Object.values(artifact.definitions);
    cachedArtifactIdentity = artifact.header.identity;
    return cachedBuiltinArtifactEntries;
}

/**
 * @param {import('./artifacts/compiledArtifact').CompiledArtifactDefinitionEntry[]} entries
 * @returns {{ definitions: import('./types').SearchParameterDefinition[], diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function activateHydratedBuiltinDefinitions(entries) {
    /** @type {import('./types').SearchParameterDefinition[]} */
    const definitions = [];
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const entry of entries) {
        const hydrated = compiledArtifact.hydrateDefinitionEntry(entry);
        diagnostics.push(...entry.compile.diagnostics);
        const activated = applyActivationOverlay(hydrated, {
            compilable: entry.compile.compilable,
            reason: entry.compile.reason
        });
        activated.lookupPlans = entry.compile.lookupPlans;
        definitions.push(activated);
    }

    return { definitions, diagnostics };
}

/**
 * @param {import('./types').SearchParameterDefinition[]} definitions
 * @returns {{ compiledDefinitions: import('./types').SearchParameterDefinition[], diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function compileDefinitions(definitions) {
    /** @type {import('./types').SearchParameterDefinition[]} */
    const compiledDefinitions = [];
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const definition of definitions) {
        const compileResult = compiler.compileDefinition(definition);
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

    return { compiledDefinitions, diagnostics };
}

/**
 * @param {Object} options
 * @param {import('./types').SearchParameterResource[]} [options.databaseResources]
 * @returns {Promise<import('./types').RegistrySnapshot>}
 */
async function reloadRegistryFromArtifact(options) {
    const databaseResources =
        options.databaseResources || (await fetchDatabaseSearchParameters());
    const database = loadDatabaseDefinitions(databaseResources);
    const artifactEntries = loadBuiltinArtifactEntries();
    const builtin = activateHydratedBuiltinDefinitions(artifactEntries);
    const databaseCompiled = compileDefinitions(database.definitions);

    const diagnostics = [
        ...builtin.diagnostics,
        ...database.diagnostics,
        ...databaseCompiled.diagnostics
    ];
    const merged = mergeDefinitions([
        ...builtin.definitions,
        ...databaseCompiled.compiledDefinitions
    ]);
    diagnostics.push(...merged.diagnostics);
    snapshotVersion += 1;
    const snapshot = buildRegistrySnapshot({
        definitions: merged.definitions,
        diagnostics,
        version: snapshotVersion
    });
    currentSnapshot = snapshot;
    return snapshot;
}

/**
 * @param {Object} options
 * @param {string} options.bundlePath
 * @param {import('./types').SearchParameterResource[]} [options.databaseResources]
 * @returns {Promise<import('./types').RegistrySnapshot>}
 */
async function reloadRegistryLiveCompile(options) {
    const builtin = loadBuiltinDefinitions(options.bundlePath);
    const databaseResources =
        options.databaseResources || (await fetchDatabaseSearchParameters());
    const database = loadDatabaseDefinitions(databaseResources);

    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [...builtin.diagnostics, ...database.diagnostics];
    const compiled = compileDefinitions([...builtin.definitions, ...database.definitions]);
    diagnostics.push(...compiled.diagnostics);

    const merged = mergeDefinitions(compiled.compiledDefinitions);
    diagnostics.push(...merged.diagnostics);
    snapshotVersion += 1;
    const snapshot = buildRegistrySnapshot({
        definitions: merged.definitions,
        diagnostics,
        version: snapshotVersion
    });
    currentSnapshot = snapshot;
    return snapshot;
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

    const useLiveCompile = options.bundlePath !== undefined;

    reloadPromise = (async () => {
        if (useLiveCompile) {
            return reloadRegistryLiveCompile(
                /** @type {{ bundlePath: string, databaseResources?: import('./types').SearchParameterResource[] }} */ (
                    options
                )
            );
        }
        return reloadRegistryFromArtifact(options);
    })();

    try {
        return await reloadPromise;
    } catch (error) {
        diagnosticsOnFailure(error);
        if (useLiveCompile && currentSnapshot) {
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

function resetRegistryCache() {
    currentSnapshot = null;
    snapshotVersion = 0;
    reloadPromise = null;
    cachedBuiltinArtifactEntries = null;
    cachedArtifactIdentity = null;
}

module.exports = {
    getSnapshot,
    reloadRegistry,
    ensureRegistryLoaded,
    resetRegistryCache
};
