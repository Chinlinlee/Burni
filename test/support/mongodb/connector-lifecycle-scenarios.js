"use strict";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const connect = require("@models/mongodb/connector");
const {
    discoverModelFiles,
    initializeWithDiscovered,
    registerDiscoveredModels,
    MongoDBInitializationConflictError,
    MongoDBModelCollisionError
} = require("@models/mongodb/connector");
const {
    searchParameterRegistryReadinessStep
} = require("@models/mongodb/readinessSteps");

// SearchParameter is required so reloadRegistry queries the collection instead of
// taking the "model missing → []" shortcut.
const LIFECYCLE_FIXTURE_DISCOVERED = {
    resourceModels: ["Patient.js", "SearchParameter.js"],
    historyModels: ["Patient_history.js"],
    staticModels: ["FHIRStoredID.js"]
};

const UNREACHABLE_MONGO_URL =
    "mongodb://127.0.0.1:1/burni-lifecycle-unreachable?serverSelectionTimeoutMS=2000";

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {string | undefined} */
let originalMongoUrl;

/** @type {string | undefined} */
let originalShardingMode;

/** @type {Array<{ level: "log" | "error", args: unknown[] }>} */
let capturedLogs = [];

function captureConsole() {
    capturedLogs = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
        capturedLogs.push({ level: "log", args });
        originalLog.apply(console, args);
    };
    console.error = (...args) => {
        capturedLogs.push({ level: "error", args });
        originalError.apply(console, args);
    };

    return () => {
        console.log = originalLog;
        console.error = originalError;
    };
}

function buildConfigFromUri(uri, database = "burni-lifecycle-test") {
    return {
        MONGODB_CONNECTION_URL: uri,
        MONGODB_NAME: database
    };
}

async function startMemoryServer() {
    originalMongoUrl = process.env.MONGODB_CONNECTION_URL;
    memoryServer = await MongoMemoryServer.create({
        instance: {
            // Parent full-suite already has a mongod; the default 10s start window is tight.
            launchTimeout: 30000
        }
    });
    const uri = memoryServer.getUri("burni-lifecycle-test");
    process.env.MONGODB_CONNECTION_URL = uri;
    process.env.MONGODB_NAME = "burni-lifecycle-test";
    delete process.env.MONGODB_HOSTS;
    delete process.env.MONGODB_PORTS;
    delete process.env.MONGODB_USER;
    delete process.env.MONGODB_PASSWORD;
    delete process.env.MONGODB_AUTH_DB;
    return uri;
}

async function stopMemoryServer() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
    }
    if (originalMongoUrl === undefined) {
        delete process.env.MONGODB_CONNECTION_URL;
    } else {
        process.env.MONGODB_CONNECTION_URL = originalMongoUrl;
    }
    originalMongoUrl = undefined;
}

function restoreShardingMode() {
    if (originalShardingMode === undefined) {
        delete process.env.MONGODB_IS_SHARDING_MODE;
    } else {
        process.env.MONGODB_IS_SHARDING_MODE = originalShardingMode;
    }
    originalShardingMode = undefined;
}

const LIFECYCLE_CONNECTOR_OPTIONS = {
    readinessStep: searchParameterRegistryReadinessStep
};

function initConnector(config, connectorOptions = {}) {
    return initializeWithDiscovered(
        config,
        LIFECYCLE_FIXTURE_DISCOVERED,
        {
            ...LIFECYCLE_CONNECTOR_OPTIONS,
            ...connectorOptions
        }
    );
}

function serializeError(error) {
    if (!error) {
        return null;
    }
    return {
        name: error.name || error.constructor?.name || "Error",
        message: error.message
    };
}

async function syncMapBeforeReady() {
    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const modelMap = connect(config, LIFECYCLE_CONNECTOR_OPTIONS);

        const hasPatientModel = Object.prototype.hasOwnProperty.call(modelMap, "Patient");
        const hasReadyPromise = typeof modelMap.ready?.then === "function";
        const readyKeys = Object.keys(modelMap);
        let readyResolvedEarly = false;
        modelMap.ready.then(() => {
            readyResolvedEarly = true;
        });

        const readySettledBeforeAwait = !readyResolvedEarly;

        await modelMap.ready;

        const discovered = discoverModelFiles();
        const registeredNames = new Set(Object.keys(modelMap));
        const discoveredNames = [
            ...discovered.resourceModels,
            ...discovered.historyModels,
            ...discovered.staticModels
        ].map((file) => file.split(".")[0]);

        return {
            ok: true,
            hasPatientModel,
            hasReadyPromise,
            readyNotInModelKeys: !readyKeys.includes("ready"),
            shardingReadyNotInModelKeys: !readyKeys.includes("shardingReady"),
            readySettledBeforeAwait,
            resourceModelCount: discovered.resourceModels.length,
            historyModelCount: discovered.historyModels.length,
            staticModelCount: discovered.staticModels.length,
            modelCount: Object.keys(modelMap).length,
            allDiscoveredModelsRegistered: discoveredNames.every((name) =>
                registeredNames.has(name)
            )
        };
    } finally {
        restoreConsole();
        await stopMemoryServer();
    }
}

async function registrationOrderAndDiscovery() {
    const discovered = discoverModelFiles();

    const resourceSorted = [...discovered.resourceModels].sort();
    const historySorted = [...discovered.historyModels].sort();
    const staticSorted = [...discovered.staticModels].sort();

    const registrationOrder = [];
    const modelMap = {};

    function registerModelGroup(files, dirname) {
        for (const file of files) {
            registrationOrder.push(`${dirname}:${file}`);
            const moduleName = file.split(".")[0];
            if (Object.prototype.hasOwnProperty.call(modelMap, moduleName)) {
                throw new MongoDBModelCollisionError(moduleName, `${dirname}/${file}`);
            }
            modelMap[moduleName] = true;
        }
    }

    const connectorSource = require("fs").readFileSync(
        require.resolve("@models/mongodb/connector"),
        "utf8"
    );

    registerModelGroup(discovered.resourceModels, "/model");
    registerModelGroup(discovered.historyModels, "/model");
    registerModelGroup(discovered.staticModels, "/staticModel");

    const firstHistoryIndex = registrationOrder.findIndex((entry) =>
        entry.includes("_history.js")
    );
    const firstStaticIndex = registrationOrder.findIndex((entry) =>
        entry.includes("/staticModel:")
    );
    const lastResourceIndex = registrationOrder.reduce(
        (lastIndex, entry, index) =>
            entry.includes("/model:") && !entry.includes("_history.js")
                ? index
                : lastIndex,
        -1
    );

    return {
        ok: true,
        resourceModelsSorted:
            JSON.stringify(discovered.resourceModels) ===
            JSON.stringify(resourceSorted),
        historyModelsSorted:
            JSON.stringify(discovered.historyModels) ===
            JSON.stringify(historySorted),
        staticModelsSorted:
            JSON.stringify(discovered.staticModels) ===
            JSON.stringify(staticSorted),
        hasResourceModels: discovered.resourceModels.length > 0,
        hasHistoryModels: discovered.historyModels.length > 0,
        hasStaticModels: discovered.staticModels.length > 0,
        registrationOrderUsesResourceBeforeHistory:
            lastResourceIndex !== -1 &&
            firstHistoryIndex !== -1 &&
            lastResourceIndex < firstHistoryIndex,
        registrationOrderUsesHistoryBeforeStatic:
            firstHistoryIndex !== -1 &&
            firstStaticIndex !== -1 &&
            firstHistoryIndex < firstStaticIndex,
        registerDiscoveredModelsSourceMatches:
            /registerModelGroup\(discovered\.resourceModels/.test(connectorSource) &&
            /registerModelGroup\(discovered\.historyModels/.test(connectorSource) &&
            /registerModelGroup\(discovered\.staticModels/.test(connectorSource),
        trackedRegistrationCount: registrationOrder.length
    };
}

async function modelCollisionImmediateError() {
    const modelMap = {};
    let thrown = null;

    try {
        registerDiscoveredModels(
            {
                resourceModels: [],
                historyModels: [],
                staticModels: ["FHIRStoredID.js", "FHIRStoredID.js"]
            },
            modelMap
        );
    } catch (error) {
        thrown = error;
    }

    return {
        ok: thrown instanceof MongoDBModelCollisionError,
        error: serializeError(thrown),
        modelMapSize: Object.keys(modelMap).length
    };
}

async function idempotentSameConfig() {
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const firstMap = initConnector(config);
        const secondMap = initConnector(config);

        const readyBeforeFirstSettles = firstMap.ready === secondMap.ready;
        const shardingReadyShared =
            firstMap.shardingReady === secondMap.shardingReady;

        await firstMap.ready;

        return {
            ok:
                firstMap === secondMap &&
                readyBeforeFirstSettles &&
                shardingReadyShared,
            sameMapReference: firstMap === secondMap,
            sharedReadyPromise: firstMap.ready === secondMap.ready,
            sharedShardingReadyPromise:
                firstMap.shardingReady === secondMap.shardingReady
        };
    } finally {
        await stopMemoryServer();
    }
}

async function rejectConflictingConfig() {
    try {
        const uri = await startMemoryServer();
        const firstConfig = buildConfigFromUri(uri, "burni-lifecycle-test");
        initConnector(firstConfig);

        let thrown = null;
        try {
            initConnector(buildConfigFromUri(uri, "different-database-name"));
        } catch (error) {
            thrown = error;
        }

        return {
            ok: thrown instanceof MongoDBInitializationConflictError,
            error: serializeError(thrown)
        };
    } finally {
        await stopMemoryServer();
    }
}

async function failedInitDoesNotRetry() {
    const restoreConsole = captureConsole();
    try {
        process.env.MONGODB_CONNECTION_URL = UNREACHABLE_MONGO_URL;
        process.env.MONGODB_NAME = "burni-lifecycle-unreachable";
        delete process.env.MONGODB_HOSTS;
        delete process.env.MONGODB_PORTS;

        const config = buildConfigFromUri(
            process.env.MONGODB_CONNECTION_URL,
            "burni-lifecycle-unreachable"
        );
        const modelMap = initConnector(config);

        let readyError = null;
        try {
            await modelMap.ready;
        } catch (error) {
            readyError = error;
        }

        let secondInitError = null;
        try {
            initConnector(config);
        } catch (error) {
            secondInitError = error;
        }

        return {
            ok: Boolean(readyError) && Boolean(secondInitError),
            readyError: serializeError(readyError),
            secondInitError: serializeError(secondInitError),
            secondInitMatchesReadyFailure:
                secondInitError?.message === readyError?.message
        };
    } finally {
        restoreConsole();
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        delete process.env.MONGODB_CONNECTION_URL;
        delete process.env.MONGODB_NAME;
    }
}

async function databaseAndRegistrySuccess() {
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const modelMap = initConnector(config);

        await modelMap.ready;
        await modelMap.shardingReady;

        return {
            ok: mongoose.connection.readyState === 1,
            databaseName: mongoose.connection.name,
            registryReady: true,
            shardingReady: true,
            modelCount: Object.keys(modelMap).length
        };
    } finally {
        await stopMemoryServer();
    }
}

async function databaseFailureBlocksReady() {
    const restoreConsole = captureConsole();
    try {
        process.env.MONGODB_CONNECTION_URL = UNREACHABLE_MONGO_URL;
        process.env.MONGODB_NAME = "burni-lifecycle-unreachable";
        delete process.env.MONGODB_HOSTS;
        delete process.env.MONGODB_PORTS;
        delete process.env.MONGODB_IS_SHARDING_MODE;

        const config = buildConfigFromUri(
            process.env.MONGODB_CONNECTION_URL,
            "burni-lifecycle-unreachable"
        );
        const modelMap = initConnector(config);

        let readyError = null;
        let shardingError = null;
        let shardingReadyResolved = false;
        try {
            await modelMap.ready;
        } catch (error) {
            readyError = error;
        }
        try {
            await modelMap.shardingReady;
            shardingReadyResolved = true;
        } catch (error) {
            shardingError = error;
        }

        return {
            ok: Boolean(readyError),
            readyError: serializeError(readyError),
            shardingError: serializeError(shardingError),
            shardingReadyResolvedWhenDisabled: shardingReadyResolved
        };
    } finally {
        restoreConsole();
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        delete process.env.MONGODB_CONNECTION_URL;
        delete process.env.MONGODB_NAME;
    }
}

async function registryFailureBlocksReady() {
    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const modelMap = initConnector(config, {
            readinessStep: async () => {
                throw new Error("simulated SearchParameter registry failure");
            }
        });

        let readyError = null;
        try {
            await modelMap.ready;
        } catch (error) {
            readyError = error;
        }

        return {
            ok:
                Boolean(readyError) &&
                readyError.message.includes("simulated SearchParameter registry failure") &&
                mongoose.connection.readyState === 1,
            readyError: serializeError(readyError),
            databaseConnected: mongoose.connection.readyState === 1
        };
    } finally {
        restoreConsole();
        await stopMemoryServer();
    }
}

async function staleArtifactBlocksReady() {
    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const compiledArtifactModule = require("@models/FHIR/searchParameter/registry/artifacts/compiledArtifact");
        const savedRead = compiledArtifactModule.readArtifact;
        compiledArtifactModule.readArtifact = () => {
            const artifact = savedRead();
            return {
                ...artifact,
                header: {
                    ...artifact.header,
                    identity: {
                        ...artifact.header.identity,
                        bundleChecksum: "0".repeat(64)
                    }
                }
            };
        };

        const modelMap = initConnector(config);

        let readyError = null;
        try {
            await modelMap.ready;
        } catch (error) {
            readyError = error;
        }

        compiledArtifactModule.readArtifact = savedRead;

        return {
            ok:
                Boolean(readyError) &&
                readyError.message.includes("npm run search-parameter:build-artifacts") &&
                mongoose.connection.readyState === 1,
            readyError: serializeError(readyError),
            databaseConnected: mongoose.connection.readyState === 1
        };
    } finally {
        restoreConsole();
        await stopMemoryServer();
    }
}

async function shardingIndependentFromApplicationReady() {
    originalShardingMode = process.env.MONGODB_IS_SHARDING_MODE;
    process.env.MONGODB_IS_SHARDING_MODE = "true";

    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const modelMap = initConnector(config, {
            readinessStep: async () => {
                await searchParameterRegistryReadinessStep();
                mongoose.connection.db.admin = () => ({
                    command(command) {
                        if (command.enableSharding) {
                            return Promise.resolve({ ok: 1 });
                        }
                        if (command.shardCollection) {
                            return Promise.resolve({ ok: 1 });
                        }
                        return Promise.reject(
                            new Error(
                                `unexpected admin command: ${JSON.stringify(command)}`
                            )
                        );
                    }
                });
            }
        });
        await modelMap.ready;
        await modelMap.shardingReady;

        return {
            ok: true,
            readyResolved: true,
            shardingReadyResolved: true
        };
    } finally {
        restoreConsole();
        restoreShardingMode();
        await stopMemoryServer();
    }
}

async function shardingFailureDoesNotRejectReady() {
    originalShardingMode = process.env.MONGODB_IS_SHARDING_MODE;
    process.env.MONGODB_IS_SHARDING_MODE = "true";

    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = buildConfigFromUri(uri);
        const modelMap = initConnector(config, {
            readinessStep: async () => {
                await searchParameterRegistryReadinessStep();
                mongoose.connection.db.admin = () => ({
                    command() {
                        return Promise.reject(new Error("simulated sharding failure"));
                    }
                });
            }
        });
        await modelMap.ready;

        let shardingError = null;
        try {
            await modelMap.shardingReady;
        } catch (error) {
            shardingError = error;
        }

        return {
            ok:
                Boolean(shardingError) &&
                shardingError.message.includes("simulated sharding failure"),
            readyResolved: true,
            shardingError: serializeError(shardingError)
        };
    } finally {
        restoreConsole();
        restoreShardingMode();
        await stopMemoryServer();
    }
}

async function safeInitLogs() {
    const restoreConsole = captureConsole();
    try {
        const uri = await startMemoryServer();
        const config = {
            MONGODB_CONNECTION_URL: uri,
            MONGODB_NAME: "burni-lifecycle-test",
            MONGODB_USER: "lifecycle-user",
            MONGODB_PASSWORD: "super-secret-password",
            MONGODB_AUTH_DB: "admin"
        };

        const modelMap = initConnector(config);
        await modelMap.ready;

        const serializedLogs = capturedLogs
            .flatMap((entry) => entry.args)
            .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
            .join("\n");

        return {
            ok: true,
            modelRegistryLogRecorded: serializedLogs.includes(
                "[mongodb] model registry registered in"
            ),
            databaseLogRecorded: serializedLogs.includes("[mongodb] database ready in"),
            searchParameterLogRecorded: serializedLogs.includes(
                "[mongodb] SearchParameter registry loaded in"
            ),
            totalInitLogRecorded: serializedLogs.includes(
                "[mongodb] initialization complete in"
            ),
            noPasswordInLogs: !serializedLogs.includes("super-secret-password"),
            noAuthenticatedUrlInLogs:
                !serializedLogs.includes("lifecycle-user:super-secret-password@") &&
                !serializedLogs.includes("mongodb://lifecycle-user:")
        };
    } finally {
        restoreConsole();
        await stopMemoryServer();
    }
}

async function preExistingConnection() {
    try {
        const uri = await startMemoryServer();
        await mongoose.connect(uri);

        let connectCalledAgain = false;
        const originalConnect = mongoose.connect.bind(mongoose);
        mongoose.connect = async (...args) => {
            connectCalledAgain = true;
            return originalConnect(...args);
        };

        const modelMap = initConnector(buildConfigFromUri(uri));
        await modelMap.ready;
        mongoose.connect = originalConnect;

        return {
            ok:
                mongoose.connection.readyState === 1 &&
                !connectCalledAgain,
            connectionReadyState: mongoose.connection.readyState,
            connectCalledAgain
        };
    } finally {
        await stopMemoryServer();
    }
}

module.exports = {
    syncMapBeforeReady,
    registrationOrderAndDiscovery,
    modelCollisionImmediateError,
    idempotentSameConfig,
    rejectConflictingConfig,
    failedInitDoesNotRetry,
    databaseAndRegistrySuccess,
    databaseFailureBlocksReady,
    registryFailureBlocksReady,
    staleArtifactBlocksReady,
    shardingIndependentFromApplicationReady,
    shardingFailureDoesNotRejectReady,
    safeInitLogs,
    preExistingConnection
};
