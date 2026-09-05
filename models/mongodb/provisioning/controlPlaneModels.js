"use strict";

const { CONTROL_PLANE_COLLECTIONS } = require("./contracts");

const LOCK_INDEX_NAME = "databaseIdentity_unique";
const STATE_INDEX_NAME = "databaseIdentity_unique";

/**
 * @param {import("mongoose").Schema} Schema
 * @returns {import("mongoose").Schema}
 */
function createProvisioningLockSchema(Schema) {
    const schema = new Schema(
        {
            databaseIdentity: {
                type: String,
                required: true
            },
            ownerId: {
                type: String,
                required: true
            },
            runId: {
                type: String,
                required: true
            },
            acquiredAt: {
                type: Date,
                required: true
            },
            expiresAt: {
                type: Date,
                required: true
            },
            updatedAt: {
                type: Date,
                required: true
            }
        },
        {
            versionKey: false,
            autoCreate: false,
            autoIndex: false
        }
    );

    schema.index(
        {
            databaseIdentity: 1
        },
        {
            unique: true,
            name: LOCK_INDEX_NAME,
            background: true
        }
    );

    return schema;
}

/**
 * @param {import("mongoose").Schema} Schema
 * @returns {import("mongoose").Schema}
 */
function createProvisioningStateSchema(Schema) {
    const schema = new Schema(
        {
            databaseIdentity: {
                type: String,
                required: true
            },
            runId: {
                type: String,
                required: true
            },
            manifestChecksum: {
                type: String,
                required: true
            },
            manifestVersion: {
                type: Number,
                required: true
            },
            phase: {
                type: String,
                required: true
            },
            status: {
                type: String,
                required: true
            },
            startedAt: {
                type: Date,
                required: true
            },
            updatedAt: {
                type: Date,
                required: true
            },
            completedAt: {
                type: Date
            },
            phaseResults: {
                type: Array,
                default: []
            },
            driftSummary: {
                type: Object,
                default: () => ({})
            },
            errors: {
                type: [String],
                default: []
            }
        },
        {
            versionKey: false,
            autoCreate: false,
            autoIndex: false
        }
    );

    schema.index(
        {
            databaseIdentity: 1
        },
        {
            unique: true,
            name: STATE_INDEX_NAME,
            background: true
        }
    );

    return schema;
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {{ lockModel: import("mongoose").Model, stateModel: import("mongoose").Model }}
 */
function registerControlPlaneModels(connection) {
    const Schema = connection.base.Schema;
    const lockModel = connection.model(
        "MongoProvisioningLock",
        createProvisioningLockSchema(Schema),
        CONTROL_PLANE_COLLECTIONS.LOCK
    );
    const stateModel = connection.model(
        "MongoProvisioningState",
        createProvisioningStateSchema(Schema),
        CONTROL_PLANE_COLLECTIONS.STATE
    );
    return { lockModel, stateModel };
}

/**
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function ensureControlPlaneCollections(db) {
    const names = new Set(
        (await db.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
    );

    for (const collectionName of Object.values(CONTROL_PLANE_COLLECTIONS)) {
        if (!names.has(collectionName)) {
            await db.createCollection(collectionName);
        }
    }

    const lockCollection = db.collection(CONTROL_PLANE_COLLECTIONS.LOCK);
    const stateCollection = db.collection(CONTROL_PLANE_COLLECTIONS.STATE);
    await ensureUniqueIndex(lockCollection, { databaseIdentity: 1 }, LOCK_INDEX_NAME);
    await ensureUniqueIndex(stateCollection, { databaseIdentity: 1 }, STATE_INDEX_NAME);
}

/**
 * @param {import("mongodb").Collection} collection
 * @param {Record<string, number>} key
 * @param {string} name
 */
async function ensureUniqueIndex(collection, key, name) {
    const indexes = await collection.listIndexes().toArray();
    const existing = indexes.find((entry) => entry.name === name);
    if (existing) {
        return;
    }
    await collection.createIndex(key, {
        unique: true,
        name,
        background: true
    });
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {Promise<{ lockModel: import("mongoose").Model, stateModel: import("mongoose").Model }>}
 */
async function ensureControlPlaneOnConnection(connection) {
    if (!connection.db) {
        throw new Error("Mongoose connection is not ready for control-plane provisioning");
    }
    await ensureControlPlaneCollections(connection.db);
    return registerControlPlaneModels(connection);
}

module.exports = {
    LOCK_INDEX_NAME,
    STATE_INDEX_NAME,
    createProvisioningLockSchema,
    createProvisioningStateSchema,
    registerControlPlaneModels,
    ensureControlPlaneCollections,
    ensureControlPlaneOnConnection
};
