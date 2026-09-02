const registerTemporalMigrationCheckpointModel = require("../../../mongodb/staticModel/TemporalMigrationCheckpoint");

const RUN_COMPLETION_COLLECTION = "_run";
const RUN_COMPLETION_BATCH_ID = "_complete";

/**
 * @param {import("mongoose").Connection} connection
 * @returns {import("mongoose").Model}
 */
function resolveCheckpointModel(connection) {
    if (connection.models?.TemporalMigrationCheckpoint) {
        return connection.models.TemporalMigrationCheckpoint;
    }
    return registerTemporalMigrationCheckpointModel(connection);
}

/**
 * @param {Record<string, unknown> | null | undefined} document
 * @returns {import("./migrationContracts").CheckpointRecord | null}
 */
function toCheckpointRecord(document) {
    if (!document) {
        return null;
    }

    /** @type {{ sourceCount?: number, targetCount?: number }} */
    const counts = {};
    if (typeof document.sourceCount === "number") {
        counts.sourceCount = document.sourceCount;
    }
    if (typeof document.targetCount === "number") {
        counts.targetCount = document.targetCount;
    }

    /** @type {import("./migrationContracts").CheckpointRecord} */
    const record = {
        runId: String(document.runId),
        collection: String(document.collection),
        batchId: String(document.batchId),
        status: /** @type {import("./migrationContracts").CheckpointRecord["status"]} */ (
            document.status
        ),
        counts
    };

    if (
        document.errorMetadata !== undefined &&
        document.errorMetadata !== null &&
        typeof document.errorMetadata === "object" &&
        !Array.isArray(document.errorMetadata)
    ) {
        record.errorMetadata = /** @type {NonNullable<import("./migrationContracts").CheckpointRecord["errorMetadata"]>} */ (
            document.errorMetadata
        );
    }

    return record;
}

/**
 * @param {import("./migrationContracts").CheckpointRecord} record
 * @param {string} expectedStatus
 * @param {string} methodName
 */
function assertCheckpointStatus(record, expectedStatus, methodName) {
    const {
        MigrationContractError,
        MIGRATION_CONTRACT_INVALID_SHAPE,
        validateCheckpointRecord
    } = require("./migrationContracts");
    validateCheckpointRecord(record);
    if (record.status !== expectedStatus) {
        throw new MigrationContractError(
            `${methodName} requires checkpoint status ${expectedStatus}`,
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "status", value: record.status }
        );
    }
}

/**
 * @param {import("./migrationContracts").CheckpointRecord} record
 */
function assertCompletedCounts(record) {
    const { MigrationContractError, MIGRATION_CONTRACT_INVALID_SHAPE } = require("./migrationContracts");
    const sourceCount = record.counts?.sourceCount;
    const targetCount = record.counts?.targetCount;
    if (typeof sourceCount !== "number" || sourceCount < 0) {
        throw new MigrationContractError(
            "markBatchCompleted requires counts.sourceCount",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "counts.sourceCount" }
        );
    }
    if (typeof targetCount !== "number" || targetCount < 0) {
        throw new MigrationContractError(
            "markBatchCompleted requires counts.targetCount",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "counts.targetCount" }
        );
    }
}

/**
 * @param {import("./migrationContracts").CheckpointRecord & { boundary?: unknown, sourceIds?: string[] }} record
 * @param {import("./migrationContracts").MigrationRunIdentity} runIdentity
 * @returns {Record<string, unknown>}
 */
function buildCheckpointDocument(record, runIdentity) {
    /** @type {Record<string, unknown>} */
    const document = {
        runId: record.runId,
        sourceDatabaseIdentity: runIdentity.sourceDatabaseIdentity,
        targetDatabaseIdentity: runIdentity.targetDatabaseIdentity,
        collection: record.collection,
        batchId: record.batchId,
        status: record.status,
        sourceCount: record.counts?.sourceCount,
        targetCount: record.counts?.targetCount
    };

    if (Array.isArray(record.sourceIds)) {
        document.sourceIds = record.sourceIds;
    }
    if (record.boundary !== undefined) {
        document.boundary = record.boundary;
    }
    if (record.errorMetadata !== undefined) {
        document.errorMetadata = record.errorMetadata;
    }

    return document;
}

/**
 * @param {object} config
 * @param {import("mongoose").Connection} config.targetConnection
 * @param {import("./migrationContracts").MigrationRunIdentity} config.runIdentity
 * @returns {import("./migrationContracts").CheckpointWriter}
 */
function createCheckpointWriter(config) {
    const CheckpointModel = resolveCheckpointModel(config.targetConnection);
    const runIdentity = config.runIdentity;

    return {
        async getCheckpoint(runId, collection, batchId) {
            const document = await CheckpointModel.findOne({
                runId,
                collection,
                batchId
            }).lean();
            return toCheckpointRecord(document);
        },

        async markBatchStarted(record) {
            assertCheckpointStatus(record, "started", "markBatchStarted");
            const document = buildCheckpointDocument(record, runIdentity);
            await CheckpointModel.findOneAndUpdate(
                {
                    runId: record.runId,
                    collection: record.collection,
                    batchId: record.batchId
                },
                {
                    $set: document
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        },

        async markBatchCompleted(record) {
            assertCheckpointStatus(record, "completed", "markBatchCompleted");
            assertCompletedCounts(record);
            const document = buildCheckpointDocument(record, runIdentity);
            await CheckpointModel.findOneAndUpdate(
                {
                    runId: record.runId,
                    collection: record.collection,
                    batchId: record.batchId
                },
                {
                    $set: document
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        },

        async markBatchFailed(record) {
            assertCheckpointStatus(record, "failed", "markBatchFailed");
            const document = buildCheckpointDocument(record, runIdentity);
            await CheckpointModel.findOneAndUpdate(
                {
                    runId: record.runId,
                    collection: record.collection,
                    batchId: record.batchId
                },
                {
                    $set: document
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        },

        async listCompletedBatches(runId, collection) {
            /** @type {{ runId: string, status: "completed", collection?: string | { $ne: string } }} */
            const query = {
                runId,
                status: "completed",
                collection: { $ne: RUN_COMPLETION_COLLECTION }
            };
            if (typeof collection === "string" && collection.trim() !== "") {
                query.collection = collection;
            }

            const documents = await CheckpointModel.find(query)
                .sort({ batchId: 1 })
                .lean();
            return documents.map((document) => toCheckpointRecord(document));
        },

        async markRunCompleted(runId) {
            await CheckpointModel.findOneAndUpdate(
                {
                    runId,
                    collection: RUN_COMPLETION_COLLECTION,
                    batchId: RUN_COMPLETION_BATCH_ID
                },
                {
                    $set: buildCheckpointDocument(
                        {
                            runId,
                            collection: RUN_COMPLETION_COLLECTION,
                            batchId: RUN_COMPLETION_BATCH_ID,
                            status: "completed",
                            counts: { sourceCount: 0, targetCount: 0 }
                        },
                        runIdentity
                    )
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        },

        async getRunCompletion(runId) {
            const document = await CheckpointModel.findOne({
                runId,
                collection: RUN_COMPLETION_COLLECTION,
                batchId: RUN_COMPLETION_BATCH_ID,
                status: "completed"
            }).lean();
            return toCheckpointRecord(document);
        }
    };
}

module.exports = {
    RUN_COMPLETION_BATCH_ID,
    RUN_COMPLETION_COLLECTION,
    resolveCheckpointModel,
    toCheckpointRecord,
    createCheckpointWriter
};
