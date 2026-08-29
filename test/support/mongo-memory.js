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

module.exports = {
    startMongoMemory,
    stopMongoMemory
};
