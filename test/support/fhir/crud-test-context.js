const {
    dropMongoTestDatabase,
    startMongoMemory,
    stopMongoMemory
} = require("../mongo-memory");

/** @type {Record<string, string | undefined>} */
const originalEnv = {};

function setFhirCrudTestEnv() {
    if (!("ENABLE_VALIDATOR" in originalEnv)) {
        originalEnv.ENABLE_VALIDATOR = process.env.ENABLE_VALIDATOR;
    }
    process.env.ENABLE_VALIDATOR = "false";
}

function restoreFhirCrudTestEnv() {
    if (originalEnv.ENABLE_VALIDATOR === undefined) {
        delete process.env.ENABLE_VALIDATOR;
    } else {
        process.env.ENABLE_VALIDATOR = originalEnv.ENABLE_VALIDATOR;
    }
    delete originalEnv.ENABLE_VALIDATOR;
}

/**
 * @returns {Promise<{ mongoose: typeof import("mongoose"), memoryServer: import("mongodb-memory-server").MongoMemoryServer }>}
 */
async function startFhirCrudTestContext() {
    setFhirCrudTestEnv();
    return startMongoMemory();
}

async function stopFhirCrudTestContext() {
    await dropMongoTestDatabase();
    await stopMongoMemory();
    restoreFhirCrudTestEnv();
}

module.exports = {
    restoreFhirCrudTestEnv,
    setFhirCrudTestEnv,
    startFhirCrudTestContext,
    stopFhirCrudTestContext
};
