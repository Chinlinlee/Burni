"use strict";

/**
 * @typedef {Object} IdentityAuditClient
 * @property {(collectionName: string, pipeline: Record<string, unknown>[]) => Promise<Record<string, unknown>[]>} aggregate
 * @property {(collectionName: string) => Promise<boolean>} collectionExists
 */

/**
 * @param {import("mongodb").Db} db
 * @returns {IdentityAuditClient}
 */
function createIdentityAuditClient(db) {
    if (!db || typeof db.collection !== "function") {
        throw new TypeError("Identity audit client requires a MongoDB Db instance");
    }

    return {
        async aggregate(collectionName, pipeline) {
            const cursor = db.collection(collectionName).aggregate(pipeline, {
                allowDiskUse: true
            });
            return cursor.toArray();
        },
        async collectionExists(collectionName) {
            const collections = await db
                .listCollections({ name: collectionName }, { nameOnly: true })
                .toArray();
            return collections.length > 0;
        }
    };
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {IdentityAuditClient}
 */
function createIdentityAuditClientFromConnection(connection) {
    if (!connection?.db) {
        throw new Error("Mongoose connection is not ready for identity audit operations");
    }
    return createIdentityAuditClient(connection.db);
}

/**
 * @param {Record<string, Record<string, unknown>[]>} documentsByCollection
 * @returns {IdentityAuditClient & { calls: { aggregate: Array<{ collectionName: string, pipeline: Record<string, unknown>[] }>, collectionExists: string[] } }}
 */
function createInMemoryIdentityAuditClient(documentsByCollection = {}) {
    const calls = {
        aggregate: [],
        collectionExists: []
    };

    /** @type {IdentityAuditClient & { calls: typeof calls }} */
    const client = {
        calls,
        async aggregate(collectionName, pipeline) {
            calls.aggregate.push({ collectionName, pipeline });
            const documents = documentsByCollection[collectionName] || [];
            return runInMemoryDuplicateAggregation(documents);
        },
        async collectionExists(collectionName) {
            calls.collectionExists.push(collectionName);
            return Object.prototype.hasOwnProperty.call(documentsByCollection, collectionName);
        }
    };

    return client;
}

/**
 * @param {Record<string, unknown>[]} documents
 * @returns {Record<string, unknown>[]}
 */
function runInMemoryDuplicateAggregation(documents) {
    /** @type {Map<string, Record<string, unknown>[]>} */
    const grouped = new Map();

    for (const document of documents) {
        const id = document.id;
        if (typeof id !== "string" || id.length === 0) {
            continue;
        }
        const bucket = grouped.get(id) || [];
        bucket.push(document);
        grouped.set(id, bucket);
    }

    /** @type {Record<string, unknown>[]} */
    const duplicates = [];
    for (const [id, bucket] of grouped.entries()) {
        if (bucket.length <= 1) {
            continue;
        }
        duplicates.push({
            _id: id,
            count: bucket.length,
            documents: bucket.map((document) => ({
                objectId: String(document._id),
                versionId:
                    document.meta &&
                    typeof document.meta === "object" &&
                    document.meta !== null &&
                    "versionId" in document.meta
                        ? document.meta.versionId
                        : undefined,
                resourceType:
                    typeof document.resourceType === "string"
                        ? document.resourceType
                        : undefined
            }))
        });
    }

    duplicates.sort((left, right) => String(left._id).localeCompare(String(right._id)));
    return duplicates;
}

module.exports = {
    createIdentityAuditClient,
    createIdentityAuditClientFromConnection,
    createInMemoryIdentityAuditClient,
    runInMemoryDuplicateAggregation
};
