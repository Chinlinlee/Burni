const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const timing = require("./test-timing");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {string | null} */
let processUri = null;

/** @type {string | undefined} */
let originalMongoUrl;

/** @type {number} */
let activeSuiteCount = 0;

/** @type {boolean} */
let processTeardownComplete = false;

/**
 * @returns {Promise<{ mongoose: typeof mongoose, memoryServer: MongoMemoryServer }>}
 */
async function startMongoMemory() {
    if (processTeardownComplete) {
        processTeardownComplete = false;
    }

    if (originalMongoUrl === undefined) {
        originalMongoUrl = process.env.MONGODB_CONNECTION_URL;
    }

    if (!memoryServer) {
        timing.startPhase("database.startup");
        memoryServer = await MongoMemoryServer.create();
        processUri = memoryServer.getUri();
        process.env.MONGODB_CONNECTION_URL = processUri;
        timing.endPhase("database.startup");
    }

    activeSuiteCount++;

    const readyState = mongoose.connection.readyState;
    if (readyState !== 1) {
        if (readyState !== 0) {
            await mongoose.disconnect();
        }
        timing.startPhase("database.connect");
        await mongoose.connect(processUri);
        timing.endPhase("database.connect");
    }

    return { mongoose, memoryServer };
}

async function stopMongoMemory() {
    if (activeSuiteCount > 0) {
        activeSuiteCount--;
    }
}

async function dropMongoTestDatabase() {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
    }
}

async function stopMongoMemoryProcess() {
    if (processTeardownComplete) {
        return;
    }
    processTeardownComplete = true;
    activeSuiteCount = 0;

    timing.startPhase("database.teardown");
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
        processUri = null;
    }
    timing.endPhase("database.teardown");

    if (originalMongoUrl === undefined) {
        delete process.env.MONGODB_CONNECTION_URL;
    } else {
        process.env.MONGODB_CONNECTION_URL = originalMongoUrl;
    }
    originalMongoUrl = undefined;
}

/**
 * Starts MongoMemoryServer, pre-connects mongoose, then loads the connector so
 * lifecycle tests cover the pre-existing default connection path.
 *
 * @returns {Promise<{
 *   mongoose: typeof mongoose,
 *   memoryServer: MongoMemoryServer,
 *   mongodb: Record<string, unknown> & { ready: Promise<void>, shardingReady: Promise<void> }
 * }>}
 */
async function startMongoMemoryWithConnector() {
    const context = await startMongoMemory();
    const mongodb = require("../../models/mongodb/index.js");
    await mongodb.ready;
    return {
        ...context,
        mongodb
    };
}

module.exports = {
    startMongoMemory,
    startMongoMemoryWithConnector,
    stopMongoMemory,
    stopMongoMemoryProcess,
    dropMongoTestDatabase
};
