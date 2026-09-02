"use strict";
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const fs = require("fs");
const path = require("path");
const basename = path.basename(module.filename);

let initializationState = null;

class MongoDBInitializationConflictError extends Error {
    constructor() {
        super(
            "MongoDB connector already initialized with a different configuration"
        );
        this.name = "MongoDBInitializationConflictError";
    }
}

class MongoDBModelCollisionError extends Error {
    constructor(modelName, filePath) {
        super(
            `Model name collision: "${modelName}" already registered (attempted from ${filePath})`
        );
        this.name = "MongoDBModelCollisionError";
    }
}

class MongoDBConnectionConflictError extends Error {
    constructor(message) {
        super(
            message ||
                "Existing MongoDB connection does not match expected configuration"
        );
        this.name = "MongoDBConnectionConflictError";
    }
}

function buildConnectionUrl(config) {
    if (config.MONGODB_CONNECTION_URL) {
        return config.MONGODB_CONNECTION_URL;
    }

    const hosts = JSON.parse(config.MONGODB_HOSTS);
    const ports = JSON.parse(config.MONGODB_PORTS);
    const dbName = config.MONGODB_NAME;
    let databaseUrl = "";

    hosts.forEach((host, index) => {
        if (index == 0) {
            databaseUrl += `${process.env.MONGODB_PROTOCOL || "mongodb://"}${host}:${ports[0]}`;
        } else {
            databaseUrl += `,${host}:${ports[index]}`;
        }
    });
    databaseUrl += `/${dbName}`;

    return databaseUrl;
}

function normalizeConfig(config) {
    return {
        connectionUrl: buildConnectionUrl(config),
        database: config.MONGODB_NAME ?? "",
        authSource: config.MONGODB_AUTH_DB ?? "",
        username: config.MONGODB_USER ?? ""
    };
}

function fingerprintFromNormalizedConfig(normalizedConfig) {
    return JSON.stringify(normalizedConfig);
}

function markInitializationFailed(state, error) {
    state.status = "failed";
    state.error = error;
}

function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function attachReadinessToModelMap(state) {
    const ready = createDeferred();
    const shardingReady = createDeferred();

    state.readyPromise = ready.promise;
    state.shardingReadyPromise = shardingReady.promise;
    state.readySettled = false;
    state.shardingReadySettled = false;

    state.resolveReady = (value) => {
        if (state.readySettled) {
            return;
        }
        state.readySettled = true;
        ready.resolve(value);
    };
    state.rejectReady = (error) => {
        if (state.readySettled) {
            return;
        }
        state.readySettled = true;
        ready.reject(error);
    };
    state.resolveShardingReady = (value) => {
        if (state.shardingReadySettled) {
            return;
        }
        state.shardingReadySettled = true;
        shardingReady.resolve(value);
    };
    state.rejectShardingReady = (error) => {
        if (state.shardingReadySettled) {
            return;
        }
        state.shardingReadySettled = true;
        shardingReady.reject(error);
    };

    Object.defineProperty(state.modelMap, "ready", {
        value: state.readyPromise,
        enumerable: false,
        configurable: false,
        writable: false
    });
    Object.defineProperty(state.modelMap, "shardingReady", {
        value: state.shardingReadyPromise,
        enumerable: false,
        configurable: false,
        writable: false
    });
}

function failReady(state, error) {
    markInitializationFailed(state, error);
    state.rejectReady(error);
    state.rejectShardingReady(error);
}

function disableAutomaticSchemaProvisioning() {
    mongoose.set({ autoIndex: false, autoCreate: false });
    const connection = mongoose.connection;
    if (connection && connection.config) {
        connection.config.autoIndex = false;
        connection.config.autoCreate = false;
    }
}

function buildMongooseConnectOptions(config) {
    // Mongoose defaults autoIndex/autoCreate to true. With 294 FHIR models that
    // queues createCollection + createIndex on every collection as soon as the
    // connection opens, and the first query (SearchParameter registry fetch)
    // waits behind that work.
    const options = {
        autoIndex: false,
        autoCreate: false
    };

    if (config.MONGODB_CONNECTION_URL) {
        return options;
    }

    const authDB = config.MONGODB_AUTH_DB;
    options.authSource = authDB;
    options.auth = {
        authSource: authDB,
        username: config.MONGODB_USER,
        password: config.MONGODB_PASSWORD
    };
    return options;
}

function extractDatabaseFromConnectionUrl(connectionUrl) {
    const pathPart = connectionUrl
        .replace(/^mongodb(\+srv)?:\/\/[^/?#]+/, "")
        .split("?")[0];
    const database = pathPart.replace(/^\//, "").trim();
    return database || null;
}

function getExpectedDatabaseName(normalizedConfig) {
    if (normalizedConfig.database) {
        return normalizedConfig.database;
    }
    return extractDatabaseFromConnectionUrl(normalizedConfig.connectionUrl);
}

function parseConnectionUrlHosts(connectionUrl) {
    return extractHostsFromConnectionUrl(connectionUrl).map((host) =>
        host.toLowerCase()
    );
}

function extractHostsFromConnectionUrl(connectionUrl) {
    if (!connectionUrl) {
        return [];
    }

    const withoutProtocol = connectionUrl.replace(/^mongodb(\+srv)?:\/\//, "");
    const hostPart = withoutProtocol.split("/")[0].split("?")[0];
    const withoutAuth = hostPart.includes("@")
        ? hostPart.slice(hostPart.lastIndexOf("@") + 1)
        : hostPart;

    return withoutAuth
        .split(",")
        .map((segment) => {
            const trimmed = segment.trim();
            const lastColon = trimmed.lastIndexOf(":");
            if (lastColon > 0 && /^\d+$/.test(trimmed.slice(lastColon + 1))) {
                return trimmed.slice(0, lastColon);
            }
            return trimmed;
        })
        .filter(Boolean);
}

function maskConnectionInfo(normalizedConfig) {
    const masked = {
        database:
            normalizedConfig.database ||
            getExpectedDatabaseName(normalizedConfig),
        hosts: extractHostsFromConnectionUrl(normalizedConfig.connectionUrl)
    };

    if (normalizedConfig.authSource) {
        masked.authSource = normalizedConfig.authSource;
    }

    return masked;
}

function createInitTimings() {
    return {
        start: performance.now(),
        modelRegistryEnd: null,
        databaseEnd: null,
        searchParameterEnd: null,
        totalEnd: null
    };
}

function elapsedMs(timings, from = timings.start, to = performance.now()) {
    return Math.round(to - from);
}

function logInitPhaseFailure(state, failedPhase) {
    console.error(
        `[mongodb] ${failedPhase} failed after ${elapsedMs(state.timings)}ms total`
    );
}

function assertExistingConnectionMatches(normalizedConfig) {
    const connection = mongoose.connection;

    if (connection.readyState !== 1) {
        return;
    }

    const expectedDatabase = getExpectedDatabaseName(normalizedConfig);
    if (expectedDatabase && connection.name !== expectedDatabase) {
        throw new MongoDBConnectionConflictError(
            `Existing connection database "${connection.name}" does not match expected "${expectedDatabase}"`
        );
    }

    const expectedHosts = parseConnectionUrlHosts(normalizedConfig.connectionUrl);
    const actualHost = (connection.host || "").toLowerCase();
    if (expectedHosts.length > 0 && actualHost && !expectedHosts.includes(actualHost)) {
        throw new MongoDBConnectionConflictError(
            `Existing connection host "${connection.host}" does not match expected configuration`
        );
    }
}

function waitForDisconnected() {
    const connection = mongoose.connection;
    if (connection.readyState === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        connection.once("close", resolve);
    });
}

async function waitForDatabaseReady(config, state) {
    const connection = mongoose.connection;
    let readyState = connection.readyState;

    if (readyState === 3) {
        await waitForDisconnected();
        readyState = connection.readyState;
    }

    if (readyState === 1) {
        assertExistingConnectionMatches(state.normalizedConfig);
        return;
    }

    if (readyState === 2) {
        await connection.asPromise();
        assertExistingConnectionMatches(state.normalizedConfig);
        return;
    }

    const databaseUrl = state.normalizedConfig.connectionUrl;
    const opts = buildMongooseConnectOptions(config);
    await mongoose.connect(databaseUrl, opts);
}

function beginDatabaseConnection(config, state) {
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));

    if (process.env.MONGODB_IS_SHARDING_MODE != "true") {
        state.resolveShardingReady();
    }

    waitForDatabaseReady(config, state)
        .then(() => {
            state.timings.databaseEnd = performance.now();
            console.log(
                `[mongodb] database ready in ${elapsedMs(
                    state.timings,
                    state.timings.modelRegistryEnd,
                    state.timings.databaseEnd
                )}ms`,
                maskConnectionInfo(state.normalizedConfig)
            );

            const { reloadRegistry } = require("../FHIR/searchParameter/registry/registryManager");
            return reloadRegistry();
        })
        .then(() => {
            state.timings.searchParameterEnd = performance.now();
            console.log(
                `[mongodb] SearchParameter registry loaded in ${elapsedMs(
                    state.timings,
                    state.timings.databaseEnd,
                    state.timings.searchParameterEnd
                )}ms`
            );

            state.timings.totalEnd = performance.now();
            console.log(
                `[mongodb] initialization complete in ${elapsedMs(state.timings)}ms total`
            );

            state.resolveReady();
            if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
                void provisionSharding(config, state);
            }
        })
        .catch((err) => {
            const failedPhase = !state.timings.databaseEnd
                ? "database connection"
                : "SearchParameter registry";
            logInitPhaseFailure(state, failedPhase);
            console.error(err);
            failReady(state, err);
        });
}

function provisionSharding(config, state) {
    const dbName = config.MONGODB_NAME;

    return Promise.resolve()
        .then(() =>
            mongoose.connection.db.admin().command({
                enableSharding: dbName
            })
        )
        .then(() => {
            console.log(`sharding database ${dbName} successfully`);
            return shardCollections(
                getShardableModelNames(state.discovered),
                dbName
            );
        })
        .then(() => {
            state.resolveShardingReady();
        })
        .catch((err) => {
            console.error(err);
            state.rejectShardingReady(err);
        });
}

function connect(config) {
    return initializeWithDiscovered(config);
}

function initializeWithDiscovered(config, discovered) {
    const normalizedConfig = normalizeConfig(config);
    const fingerprint = fingerprintFromNormalizedConfig(normalizedConfig);

    if (initializationState) {
        if (initializationState.fingerprint !== fingerprint) {
            throw new MongoDBInitializationConflictError();
        }
        if (initializationState.error) {
            throw initializationState.error;
        }
        return initializationState.modelMap;
    }

    const state = {
        fingerprint,
        normalizedConfig,
        modelMap: {},
        status: "initializing",
        error: null,
        timings: createInitTimings()
    };
    initializationState = state;

    try {
        disableAutomaticSchemaProvisioning();
        // Tests pass a short list so lifecycle cases do not register the full catalog.
        state.discovered = discovered ?? discoverModelFiles();
        registerDiscoveredModels(state.discovered, state.modelMap, mongoose);
        state.timings.modelRegistryEnd = performance.now();
        console.log(
            `[mongodb] model registry registered in ${elapsedMs(
                state.timings,
                state.timings.start,
                state.timings.modelRegistryEnd
            )}ms (${Object.keys(state.modelMap).length} models)`
        );
    } catch (err) {
        logInitPhaseFailure(state, "model registry");
        markInitializationFailed(state, err);
        throw err;
    }

    attachReadinessToModelMap(state);
    beginDatabaseConnection(config, state);
    return state.modelMap;
}

function isModelJsFile(file) {
    return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file.slice(-3) === ".js"
    );
}

function discoverModelFiles() {
    const modelFiles = fs
        .readdirSync(path.join(__dirname, "model"))
        .filter(isModelJsFile);

    return {
        resourceModels: modelFiles
            .filter((file) => !file.endsWith("_history.js"))
            .sort(),
        historyModels: modelFiles
            .filter((file) => file.endsWith("_history.js"))
            .sort(),
        staticModels: fs
            .readdirSync(path.join(__dirname, "staticModel"))
            .filter(isModelJsFile)
            .sort()
    };
}

/**
 * @param {string[]} catalog
 * @param {boolean} [includeHistory]
 * @returns {ReturnType<typeof discoverModelFiles>}
 */
function discoverModelFilesForCatalog(catalog, includeHistory = true) {
    const resourceTypes = new Set(catalog);
    const discovered = discoverModelFiles();

    return {
        resourceModels: discovered.resourceModels.filter((file) =>
            resourceTypes.has(file.replace(/\.js$/, ""))
        ),
        historyModels: includeHistory
            ? discovered.historyModels.filter((file) =>
                  resourceTypes.has(file.replace(/_history\.js$/, ""))
              )
            : [],
        staticModels: []
    };
}

function registerModelFile(file, dirname, modelMap, connection = mongoose) {
    const moduleName = file.split(".")[0];
    if (Object.prototype.hasOwnProperty.call(modelMap, moduleName)) {
        throw new MongoDBModelCollisionError(
            moduleName,
            path.join(__dirname, dirname, file)
        );
    }
    const modelFactory = require(path.join(__dirname, dirname, moduleName));
    modelMap[moduleName] = modelFactory(connection);
}

function registerModelGroup(files, dirname, modelMap, connection = mongoose) {
    for (const file of files) {
        registerModelFile(file, dirname, modelMap, connection);
    }
}

function registerDiscoveredModels(
    discovered,
    modelMap,
    connection = mongoose
) {
    registerModelGroup(discovered.resourceModels, "/model", modelMap, connection);
    registerModelGroup(discovered.historyModels, "/model", modelMap, connection);
    registerModelGroup(discovered.staticModels, "/staticModel", modelMap, connection);
}

function getShardableModelNames(discovered) {
    return [
        ...discovered.resourceModels.map((file) => file.split(".")[0]),
        ...discovered.staticModels.map((file) => file.split(".")[0])
    ];
}

function shardCollections(modelNames, dbName) {
    if (process.env.MONGODB_IS_SHARDING_MODE != "true") {
        return Promise.resolve();
    }
    return Promise.all(
        modelNames.map((moduleName) =>
            mongoose.connection.db
                .admin()
                .command({
                    shardCollection: `${dbName}.${moduleName}`,
                    key: { id: "hashed" }
                })
                .then(() => {
                    console.log(`sharding collection ${moduleName} successfully`);
                })
        )
    );
}

module.exports = exports = connect;
exports.normalizeConfig = normalizeConfig;
exports.buildConnectionUrl = buildConnectionUrl;
exports.buildMongooseConnectOptions = buildMongooseConnectOptions;
exports.disableAutomaticSchemaProvisioning = disableAutomaticSchemaProvisioning;
exports.discoverModelFiles = discoverModelFiles;
exports.discoverModelFilesForCatalog = discoverModelFilesForCatalog;
exports.initializeWithDiscovered = initializeWithDiscovered;
exports.registerDiscoveredModels = registerDiscoveredModels;
exports.MongoDBInitializationConflictError = MongoDBInitializationConflictError;
exports.MongoDBModelCollisionError = MongoDBModelCollisionError;
exports.MongoDBConnectionConflictError = MongoDBConnectionConflictError;
