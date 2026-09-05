"use strict";

/**
 * @typedef {Object} MongoDdlClient
 * @property {() => Promise<string[]>} listCollectionNames
 * @property {(collectionName: string) => Promise<void>} createCollection
 * @property {(collectionName: string) => Promise<Record<string, unknown>[]>} listIndexes
 * @property {(collectionName: string, key: Record<string, number>, options?: Record<string, unknown>) => Promise<string>} createIndex
 * @property {(collectionName: string, indexName: string) => Promise<void>} dropIndex
 */

/**
 * @param {import("mongodb").Db} db
 * @returns {MongoDdlClient}
 */
function createMongoDdlClient(db) {
    if (!db || typeof db.listCollections !== "function") {
        throw new TypeError("Mongo DDL client requires a MongoDB Db instance");
    }

    return {
        async listCollectionNames() {
            const collections = await db.listCollections({}, { nameOnly: true }).toArray();
            return collections
                .map((entry) => entry.name)
                .filter((name) => typeof name === "string")
                .sort((left, right) => left.localeCompare(right));
        },
        async createCollection(collectionName) {
            await db.createCollection(collectionName);
        },
        async listIndexes(collectionName) {
            return db.collection(collectionName).listIndexes().toArray();
        },
        async createIndex(collectionName, key, options = {}) {
            return db.collection(collectionName).createIndex(key, options);
        },
        async dropIndex(collectionName, indexName) {
            await db.collection(collectionName).dropIndex(indexName);
        }
    };
}

/**
 * @param {Partial<MongoDdlClient>} overrides
 * @returns {MongoDdlClient}
 */
function createDdlClient(overrides = {}) {
    const calls = {
        listCollectionNames: [],
        createCollection: [],
        listIndexes: [],
        createIndex: [],
        dropIndex: []
    };

    /** @type {MongoDdlClient} */
    const client = {
        listCollectionNames: async (...args) => {
            calls.listCollectionNames.push(args);
            if (overrides.listCollectionNames) {
                return overrides.listCollectionNames(...args);
            }
            return [];
        },
        createCollection: async (...args) => {
            calls.createCollection.push(args);
            if (overrides.createCollection) {
                return overrides.createCollection(...args);
            }
        },
        listIndexes: async (...args) => {
            calls.listIndexes.push(args);
            if (overrides.listIndexes) {
                return overrides.listIndexes(...args);
            }
            return [{ key: { _id: 1 }, name: "_id_" }];
        },
        createIndex: async (...args) => {
            calls.createIndex.push(args);
            if (overrides.createIndex) {
                return overrides.createIndex(...args);
            }
            const options = args[2] || {};
            return options.name || "index";
        },
        dropIndex: async (...args) => {
            calls.dropIndex.push(args);
            if (overrides.dropIndex) {
                return overrides.dropIndex(...args);
            }
        }
    };

    client.calls = calls;
    return client;
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {MongoDdlClient}
 */
function createMongoDdlClientFromConnection(connection) {
    if (!connection?.db) {
        throw new Error("Mongoose connection is not ready for MongoDB DDL operations");
    }
    return createMongoDdlClient(connection.db);
}

module.exports = {
    createMongoDdlClient,
    createMongoDdlClientFromConnection,
    createDdlClient
};
