const {
    discoverModelFiles,
    registerDiscoveredModels
} = require("../../../mongodb/connector");
const { validateTransformedBatch } = require("./batchDocumentValidator");
const { resolveModel } = require("./temporalPreflight");

const MIGRATION_TARGET_BATCH_UNKNOWN_COLLECTION = "MIGRATION_TARGET_BATCH_UNKNOWN_COLLECTION";

/**
 * @param {object | undefined} targetModels
 * @param {string} collectionName
 * @returns {import("mongoose").Model | undefined}
 */
function resolveTargetModel(targetModels, collectionName) {
    return resolveModel(targetModels, collectionName);
}

/**
 * @param {object[]} documents
 * @returns {import("mongodb").AnyBulkWriteOperation[]}
 */
function buildBulkWriteOperations(documents) {
    return documents.map((document) => ({
        replaceOne: {
            filter: { _id: document._id },
            replacement: document,
            upsert: true
        }
    }));
}

/**
 * @param {unknown} error
 * @returns {Array<{ message: string, code?: string }>}
 */
function formatBulkWriteErrors(error) {
    const candidate = /** @type {{ writeErrors?: Array<{ errmsg?: string, message?: string, code?: number }>, message?: string }>} */ (
        error
    );
    if (Array.isArray(candidate.writeErrors) && candidate.writeErrors.length > 0) {
        return candidate.writeErrors.map((writeError) => ({
            message: writeError.errmsg || writeError.message || String(writeError),
            code: writeError.code !== undefined ? String(writeError.code) : undefined
        }));
    }
    if (error instanceof Error) {
        return [{ message: error.message }];
    }
    return [{ message: String(error) }];
}

/**
 * @param {object} config
 * @param {import("mongoose").Connection} config.targetConnection
 * @param {Record<string, import("mongoose").Model>} [config.targetModels]
 * @param {ReturnType<typeof discoverModelFiles>} [config.discovered]
 * @returns {import("./migrationContracts").TargetBatchWriter}
 */
function createTargetBatchWriter(config) {
    /** @type {Record<string, import("mongoose").Model>} */
    const targetModels =
        config.targetModels ??
        (() => {
            const models = {};
            const discovered = config.discovered ?? discoverModelFiles();
            registerDiscoveredModels(discovered, models, config.targetConnection);
            return models;
        })();

    return {
        async writeBatch(collectionName, documents, context) {
            const {
                MigrationContractError,
                MIGRATION_CONTRACT_INVALID_CONFIG,
                validateMigrationWriteContext
            } = require("./migrationContracts");
            validateMigrationWriteContext(context);

            if (!Array.isArray(documents)) {
                throw new MigrationContractError(
                    "writeBatch requires documents to be an array",
                    MIGRATION_CONTRACT_INVALID_CONFIG,
                    { field: "documents" }
                );
            }

            if (documents.length === 0) {
                return {
                    batchId: context.batchId,
                    status: "skipped",
                    sourceCount: 0,
                    targetCount: 0,
                    errors: []
                };
            }

            const model = resolveTargetModel(targetModels, collectionName);
            if (!model || typeof model.collection?.bulkWrite !== "function") {
                throw new MigrationContractError(
                    `writeBatch could not resolve target model for collection ${collectionName}`,
                    MIGRATION_TARGET_BATCH_UNKNOWN_COLLECTION,
                    { field: "collectionName", collectionName }
                );
            }

            const validation = validateTransformedBatch(documents, context);
            if (!validation.valid) {
                return {
                    batchId: context.batchId,
                    status: "failed",
                    sourceCount: documents.length,
                    targetCount: 0,
                    errors: validation.errors.map((error) => ({
                        message: error.message,
                        path: error.path,
                        code: error.code,
                        documentId: error.documentId
                    }))
                };
            }

            try {
                await model.collection.bulkWrite(buildBulkWriteOperations(documents));
                return {
                    batchId: context.batchId,
                    status: "completed",
                    sourceCount: documents.length,
                    targetCount: documents.length,
                    errors: []
                };
            } catch (error) {
                return {
                    batchId: context.batchId,
                    status: "failed",
                    sourceCount: documents.length,
                    targetCount: 0,
                    errors: formatBulkWriteErrors(error)
                };
            }
        }
    };
}

module.exports = {
    MIGRATION_TARGET_BATCH_UNKNOWN_COLLECTION,
    resolveTargetModel,
    buildBulkWriteOperations,
    createTargetBatchWriter
};
