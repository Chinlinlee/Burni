const os = require("os");
const path = require("path");
const { createCatalogSourceIterator } = require("./sourceReader");
const {
    createDocumentTransformer,
    DocumentTransformError
} = require("./documentTransformer");
const { createTargetBatchWriter } = require("./targetBatchWriter");
const { createCheckpointWriter, resolveCheckpointModel } = require("./checkpointWriter");
const {
    createAuditWriter,
    validateMigrationRunIdentity,
    MigrationContractError,
    MIGRATION_CONTRACT_INVALID_CONFIG
} = require("./migrationContracts");

const INCOMPLETE_CHECKPOINT_STATUSES = Object.freeze(["pending", "started", "failed"]);

/**
 * @param {unknown} connection
 * @param {string} fieldName
 */
function requireMongooseConnection(connection, fieldName) {
    if (
        connection === null ||
        typeof connection !== "object" ||
        Array.isArray(connection) ||
        (typeof /** @type {Record<string, unknown>} */ (connection).model !== "function" &&
            (/** @type {Record<string, unknown>} */ (connection).db === null ||
                typeof /** @type {Record<string, unknown>} */ (connection).db !== "object"))
    ) {
        throw new MigrationContractError(
            `runStreamingMigration requires a Mongoose connection for ${fieldName}`,
            MIGRATION_CONTRACT_INVALID_CONFIG,
            { field: fieldName }
        );
    }
}

/**
 * @param {import("./migrationContracts").MigrationRunIdentity | string} runIdentity
 * @param {import("mongoose").Connection} targetConnection
 * @returns {Promise<boolean>}
 */
async function isMigrationRunComplete(runIdentity, targetConnection) {
    requireMongooseConnection(targetConnection, "targetConnection");
    const runId =
        typeof runIdentity === "string"
            ? runIdentity
            : (validateMigrationRunIdentity(runIdentity), runIdentity.runId);

    const CheckpointModel = resolveCheckpointModel(targetConnection);
    const incompleteCount = await CheckpointModel.countDocuments({
        runId,
        status: { $in: [...INCOMPLETE_CHECKPOINT_STATUSES] }
    });
    if (incompleteCount > 0) {
        return false;
    }

    const runCompletion = await CheckpointModel.findOne({
        runId,
        collection: "_run",
        batchId: "_complete",
        status: "completed"
    }).lean();
    return runCompletion !== null;
}

/**
 * @param {unknown} error
 * @returns {{ message: string, code?: string }}
 */
function formatBatchError(error) {
    if (error instanceof DocumentTransformError) {
        return {
            message: error.message,
            code: error.code
        };
    }
    if (error instanceof Error) {
        return { message: error.message };
    }
    return { message: String(error) };
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {import("mongoose").Connection} input.targetConnection
 * @param {import("./migrationContracts").MigrationRunIdentity} input.runIdentity
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {{ info?: (message: string, metadata?: object) => void, warn?: (message: string, metadata?: object) => void, error?: (message: string, metadata?: object) => void }} [input.logger]
 * @param {boolean} [input.resume]
 * @param {number} [input.maxBatches]
 * @param {Record<string, import("mongoose").Model>} [input.targetModels]
 * @param {ReturnType<typeof import("../../../mongodb/connector").discoverModelFiles>} [input.discovered]
 * @param {string} [input.auditPath]
 * @returns {Promise<{
 *   runIdentity: import("./migrationContracts").MigrationRunIdentity,
 *   batchesCompleted: number,
 *   batchesFailed: number,
 *   batchesSkipped: number,
 *   documentsProcessed: number,
 *   status: "complete" | "incomplete"
 * }>}
 */
async function runStreamingMigration({
    sourceConnection,
    targetConnection,
    runIdentity,
    catalog,
    includeHistory = true,
    batchSize,
    logger,
    resume = true,
    maxBatches,
    targetModels,
    discovered,
    auditPath
}) {
    requireMongooseConnection(sourceConnection, "sourceConnection");
    requireMongooseConnection(targetConnection, "targetConnection");
    validateMigrationRunIdentity(runIdentity);

    const log = {
        info: typeof logger?.info === "function" ? logger.info.bind(logger) : () => {},
        warn: typeof logger?.warn === "function" ? logger.warn.bind(logger) : () => {},
        error: typeof logger?.error === "function" ? logger.error.bind(logger) : () => {}
    };

    const documentTransformer = createDocumentTransformer({ runIdentity });
    const targetBatchWriter = createTargetBatchWriter({
        targetConnection,
        runId: runIdentity.runId,
        targetModels,
        discovered
    });
    const checkpointWriter = createCheckpointWriter({
        targetConnection,
        runIdentity
    });
    const auditWriter = createAuditWriter({
        runId: runIdentity.runId,
        artifactPath:
            auditPath ||
            path.join(os.tmpdir(), `temporal-migration-audit-${runIdentity.runId}.jsonl`)
    });

    /** @type {{
     *   runIdentity: import("./migrationContracts").MigrationRunIdentity,
     *   batchesCompleted: number,
     *   batchesFailed: number,
     *   batchesSkipped: number,
     *   documentsProcessed: number,
     *   status: "complete" | "incomplete"
     * }} */
    const summary = {
        runIdentity,
        batchesCompleted: 0,
        batchesFailed: 0,
        batchesSkipped: 0,
        documentsProcessed: 0,
        status: "incomplete"
    };

    let catalogExhausted = false;
    let batchesHandled = 0;

    for await (const batch of createCatalogSourceIterator({
        sourceConnection,
        catalog,
        includeHistory,
        batchSize
    })) {
            if (typeof maxBatches === "number" && batchesHandled >= maxBatches) {
                break;
            }

            const { source, documents, boundary } = batch;
            if (!boundary || documents.length === 0) {
                continue;
            }

            const { batchId, collection } = boundary;
            batchesHandled += 1;

            const existingCheckpoint = await checkpointWriter.getCheckpoint(
                runIdentity.runId,
                collection,
                batchId
            );
            if (resume && existingCheckpoint?.status === "completed") {
                summary.batchesSkipped += 1;
                summary.documentsProcessed += existingCheckpoint.counts?.sourceCount ?? documents.length;
                log.info("Skipping completed batch", { batchId, collection });
                continue;
            }

            await checkpointWriter.markBatchStarted({
                runId: runIdentity.runId,
                collection,
                batchId,
                status: "started",
                counts: {},
                sourceIds: boundary.sourceIds,
                boundary
            });

            try {
                const transformContext = {
                    runIdentity,
                    source,
                    batchId
                };
                const transformedBatch = documentTransformer.transformBatch(documents, transformContext);
                const transformedDocuments = transformedBatch.map((entry) => entry.document);
                const auditEntries = transformedBatch.flatMap((entry) => entry.auditEntries);

                await auditWriter.append(auditEntries);
                await auditWriter.flush();

                const writeResult = await targetBatchWriter.writeBatch(
                    collection,
                    transformedDocuments,
                    {
                        runIdentity,
                        source,
                        batchId,
                        sourceDocuments: documents
                    }
                );

                if (writeResult.status !== "completed") {
                    await checkpointWriter.markBatchFailed({
                        runId: runIdentity.runId,
                        collection,
                        batchId,
                        status: "failed",
                        counts: {
                            sourceCount: writeResult.sourceCount,
                            targetCount: writeResult.targetCount
                        },
                        sourceIds: boundary.sourceIds,
                        boundary,
                        errorMetadata: {
                            message: writeResult.errors[0]?.message || "target batch write failed",
                            code: writeResult.errors[0]?.code,
                            at: new Date().toISOString()
                        }
                    });
                    summary.batchesFailed += 1;
                    log.error("Batch write failed", {
                        batchId,
                        collection,
                        errors: writeResult.errors
                    });
                    continue;
                }

                await checkpointWriter.markBatchCompleted({
                    runId: runIdentity.runId,
                    collection,
                    batchId,
                    status: "completed",
                    counts: {
                        sourceCount: writeResult.sourceCount,
                        targetCount: writeResult.targetCount
                    },
                    sourceIds: boundary.sourceIds,
                    boundary
                });
                summary.batchesCompleted += 1;
                summary.documentsProcessed += writeResult.sourceCount;
                log.info("Batch completed", {
                    batchId,
                    collection,
                    sourceCount: writeResult.sourceCount
                });
            } catch (error) {
                const formatted = formatBatchError(error);
                await checkpointWriter.markBatchFailed({
                    runId: runIdentity.runId,
                    collection,
                    batchId,
                    status: "failed",
                    counts: {},
                    sourceIds: boundary.sourceIds,
                    boundary,
                    errorMetadata: {
                        message: formatted.message,
                        code: formatted.code,
                        at: new Date().toISOString()
                    }
                });
                summary.batchesFailed += 1;
                log.error("Batch processing failed", {
                    batchId,
                    collection,
                    message: formatted.message
                });
            }
        }

    catalogExhausted =
        typeof maxBatches !== "number" || batchesHandled < maxBatches;

    const runComplete =
        summary.batchesFailed === 0 && catalogExhausted;
    summary.status = runComplete ? "complete" : "incomplete";

    if (runComplete) {
        await checkpointWriter.markRunCompleted(runIdentity.runId);
    }

    return summary;
}

module.exports = {
    INCOMPLETE_CHECKPOINT_STATUSES,
    isMigrationRunComplete,
    runStreamingMigration
};
