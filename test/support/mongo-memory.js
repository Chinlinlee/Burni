const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {string | undefined} */
let originalMongoUrl;

/**
 * @returns {Promise<{ mongoose: typeof mongoose, memoryServer: MongoMemoryServer }>}
 */
async function startMongoMemory() {
    originalMongoUrl = process.env.MONGODB_CONNECTION_URL;
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    process.env.MONGODB_CONNECTION_URL = uri;

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    return { mongoose, memoryServer };
}

async function stopMongoMemory() {
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
    stopMongoMemory
};
