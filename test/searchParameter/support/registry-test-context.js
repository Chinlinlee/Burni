const {
    startMongoMemory,
    stopMongoMemory
} = require("../../support/mongo-memory");

/** @type {Record<string, string | undefined>} */
const originalEnv = {};

const MODULES_TO_RELOAD = [
    "@models/FHIR/searchParameter/runtime/registrySearchHandler",
    "@models/FHIR/searchParameter/registry/registryManager"
];

function setRegistryTestEnv() {
    if (!("ENABLE_VALIDATOR" in originalEnv)) {
        originalEnv.ENABLE_VALIDATOR = process.env.ENABLE_VALIDATOR;
    }
    process.env.ENABLE_VALIDATOR = "false";
}

function restoreRegistryTestEnv() {
    if (originalEnv.ENABLE_VALIDATOR === undefined) {
        delete process.env.ENABLE_VALIDATOR;
    } else {
        process.env.ENABLE_VALIDATOR = originalEnv.ENABLE_VALIDATOR;
    }
    delete originalEnv.ENABLE_VALIDATOR;
}

function clearRegistryModuleCache() {
    for (const mod of MODULES_TO_RELOAD) {
        try {
            delete require.cache[require.resolve(mod)];
        } catch {
            // The module may not have been loaded yet.
        }
    }
}

async function startRegistryTestContext() {
    setRegistryTestEnv();
    clearRegistryModuleCache();
    const context = await startMongoMemory();
    const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
    await reloadRegistry();
    return context;
}

async function stopRegistryTestContext() {
    await stopMongoMemory();
    restoreRegistryTestEnv();
    clearRegistryModuleCache();
}

module.exports = {
    startRegistryTestContext,
    stopRegistryTestContext
};
