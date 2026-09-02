const DEFAULT_BATCH_SIZE = 100;

const NOT_IMPLEMENTED = "Not implemented";

const productionCatalog = require("../../fhir.resourceList.json");

/**
 * @param {number | undefined} batchSize
 * @returns {number}
 */
function resolveBatchSize(batchSize) {
    const resolved = batchSize ?? DEFAULT_BATCH_SIZE;
    if (!Number.isInteger(resolved) || resolved <= 0) {
        throw new RangeError("createSourceReader batchSize must be a positive integer");
    }
    return resolved;
}

/**
 * @param {import("mongoose").Connection} sourceConnection
 * @returns {import("mongodb").Db}
 */
function requireNativeDb(sourceConnection) {
    const db = sourceConnection.db;
    if (!db || typeof db.collection !== "function") {
        throw new Error(
            "createSourceReader requires a connected Mongoose connection with db.collection"
        );
    }
    return db;
}

/**
 * @param {import("./migrationContracts").MigrationBatchBoundary | undefined} boundary
 * @returns {unknown}
 */
function resolveResumeId(boundary) {
    if (!boundary) {
        return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(boundary, "lastId")) {
        return boundary.lastId;
    }
    if (boundary.resumeToken !== undefined) {
        return boundary.resumeToken;
    }
    if (boundary.startCursor !== undefined) {
        return boundary.startCursor;
    }
    return undefined;
}

/**
 * @param {string} collectionName
 * @param {unknown} resumeId
 * @param {number} documentCount
 * @returns {string}
 */
function buildBatchId(collectionName, resumeId, documentCount) {
    const resumeLabel = resumeId === undefined ? "start" : String(resumeId);
    return `${collectionName}:${resumeLabel}:${documentCount}`;
}

/**
 * @param {string[]} catalog
 * @param {boolean} includeHistory
 * @returns {import("./migrationContracts").MigrationSourceDescriptor[]}
 */
function buildCatalogSourceDescriptors(catalog, includeHistory) {
    const sources = [];
    for (const resource of catalog) {
        sources.push({
            resource,
            model: resource,
            kind: "resource",
            collectionName: resource
        });
        if (includeHistory) {
            sources.push({
                resource,
                model: `${resource}_history`,
                kind: "history",
                collectionName: `${resource}_history`
            });
        }
    }
    return sources;
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} collectionName
 * @returns {Promise<boolean>}
 */
async function isCollectionReadable(db, collectionName) {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
        return false;
    }
    const count = await db.collection(collectionName).countDocuments({}, { limit: 1 });
    return count > 0;
}

/**
 * @param {object} config
 * @param {import("mongoose").Connection} config.sourceConnection
 * @param {number} [config.batchSize]
 * @param {() => Promise<void>} [config.onClose]
 * @returns {import("./migrationContracts").SourceReader}
 */
function createSourceReader(config) {
    const batchSize = resolveBatchSize(config.batchSize);
    /** @type {Set<import("mongodb").FindCursor>} */
    const openCursors = new Set();

    return {
        async readBatch(source, boundary) {
            const { validateMigrationSourceDescriptor } = require("./migrationContracts");
            validateMigrationSourceDescriptor(source);
            const db = requireNativeDb(config.sourceConnection);
            const collection = db.collection(source.collectionName);

            const filter = {};
            const resumeId = resolveResumeId(boundary);
            if (resumeId !== undefined) {
                filter._id = { $gt: resumeId };
            }

            const cursor = collection.find(filter).sort({ _id: 1 }).limit(batchSize);
            openCursors.add(cursor);

            let documents;
            try {
                documents = await cursor.toArray();
            } finally {
                openCursors.delete(cursor);
                await cursor.close().catch(() => {});
            }

            if (documents.length === 0) {
                return { documents: [], nextBoundary: null };
            }

            const lastId = documents[documents.length - 1]._id;
            const sourceIds = documents.map((document) => String(document._id));
            const nextBoundary =
                documents.length === batchSize
                    ? {
                          batchId: buildBatchId(source.collectionName, lastId, documents.length),
                          collection: source.collectionName,
                          resumeToken: lastId,
                          lastId,
                          documentCount: documents.length,
                          sourceIds
                      }
                    : null;

            return { documents, nextBoundary };
        },

        async close() {
            await Promise.all(
                [...openCursors].map((cursor) => cursor.close().catch(() => {}))
            );
            openCursors.clear();
            if (typeof config.onClose === "function") {
                await config.onClose();
            }
        }
    };
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @returns {AsyncGenerator<{
 *   source: import("./migrationContracts").MigrationSourceDescriptor,
 *   documents: object[],
 *   boundary: import("./migrationContracts").MigrationBatchBoundary | null,
 *   nextBoundary: import("./migrationContracts").MigrationBatchBoundary | null
 * }, void, void>}
 */
async function* createCatalogSourceIterator({
    sourceConnection,
    catalog,
    includeHistory = true,
    batchSize
}) {
    const resolvedCatalog = catalog || productionCatalog;
    const reader = createSourceReader({ sourceConnection, batchSize });
    const db = requireNativeDb(sourceConnection);

    try {
        for (const source of buildCatalogSourceDescriptors(resolvedCatalog, includeHistory)) {
            const readable = await isCollectionReadable(db, source.collectionName);
            if (!readable) {
                continue;
            }

            /** @type {import("./migrationContracts").MigrationBatchBoundary | undefined} */
            let boundary;
            do {
                const result = await reader.readBatch(source, boundary);
                if (result.documents.length === 0) {
                    break;
                }

                const lastId = result.documents[result.documents.length - 1]._id;
                const currentBoundary = {
                    batchId: buildBatchId(
                        source.collectionName,
                        lastId,
                        result.documents.length
                    ),
                    collection: source.collectionName,
                    resumeToken: lastId,
                    lastId,
                    documentCount: result.documents.length,
                    sourceIds: result.documents.map((document) => String(document._id))
                };

                yield {
                    source,
                    documents: result.documents,
                    boundary: currentBoundary,
                    nextBoundary: result.nextBoundary
                };

                boundary = result.nextBoundary ?? undefined;
            } while (boundary);
        }
    } finally {
        await reader.close();
    }
}

/**
 * @param {object} config
 * @returns {import("./migrationContracts").SourceReader}
 */
function createStubSourceReader(config) {
    return {
        async readBatch() {
            throw new Error(NOT_IMPLEMENTED);
        },
        async close() {
            if (typeof config.onClose === "function") {
                await config.onClose();
            }
        }
    };
}

module.exports = {
    DEFAULT_BATCH_SIZE,
    buildCatalogSourceDescriptors,
    createSourceReader,
    createStubSourceReader,
    createCatalogSourceIterator
};
