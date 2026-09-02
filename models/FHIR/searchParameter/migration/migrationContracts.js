const {
    validateTransformedDocument,
    validateTransformedBatch
} = require("./batchDocumentValidator");

const MIGRATION_CONTRACT_INVALID_CONFIG = "MIGRATION_CONTRACT_INVALID_CONFIG";
const MIGRATION_CONTRACT_INVALID_SHAPE = "MIGRATION_CONTRACT_INVALID_SHAPE";
const MIGRATION_CONTRACT_NOT_IMPLEMENTED = "MIGRATION_CONTRACT_NOT_IMPLEMENTED";

const MIGRATION_SOURCE_KINDS = Object.freeze(["resource", "history"]);
const MIGRATION_BATCH_STATUSES = Object.freeze(["completed", "failed", "skipped"]);
const CHECKPOINT_STATUSES = Object.freeze(["pending", "started", "completed", "failed"]);
const TEMPORAL_TYPES = Object.freeze(["date", "dateTime", "instant"]);

/**
 * @typedef {Object} MigrationRunIdentity
 * @property {string} runId
 * @property {string} sourceDatabaseIdentity
 * @property {string} targetDatabaseIdentity
 */

/**
 * @typedef {Object} MigrationSourceDescriptor
 * @property {string} resource
 * @property {string} model
 * @property {"resource" | "history"} kind
 * @property {string} collectionName
 */

/**
 * @typedef {Object} MigrationBatchBoundary
 * @property {string} batchId
 * @property {string} collection
 * @property {unknown} [startCursor]
 * @property {unknown} [resumeToken]
 * @property {number} documentCount
 * @property {string[]} sourceIds
 */

/**
 * @typedef {Object} MigrationBatchResult
 * @property {string} batchId
 * @property {"completed" | "failed" | "skipped"} status
 * @property {number} sourceCount
 * @property {number} targetCount
 * @property {Array<{ message: string, path?: string, code?: string, documentId?: unknown }>} errors
 */

/**
 * @typedef {Object} AuditRecord
 * @property {string} sourceDatabaseIdentity
 * @property {string} sourceCollection
 * @property {unknown} sourceDocumentId
 * @property {string} fhirPath
 * @property {"date" | "dateTime" | "instant"} temporalType
 * @property {string} policy
 * @property {unknown} originalValue
 * @property {unknown} generatedValue
 */

/**
 * @typedef {Object} CheckpointRecord
 * @property {string} runId
 * @property {string} collection
 * @property {string} batchId
 * @property {"pending" | "started" | "completed" | "failed"} status
 * @property {{ sourceCount?: number, targetCount?: number }} counts
 * @property {{ message?: string, code?: string, at?: string }} [errorMetadata]
 */

/**
 * @typedef {Object} MigrationTransformContext
 * @property {MigrationRunIdentity} runIdentity
 * @property {MigrationSourceDescriptor} source
 * @property {string} batchId
 */

/**
 * @typedef {Object} MigrationWriteContext
 * @property {MigrationRunIdentity} runIdentity
 * @property {MigrationSourceDescriptor} source
 * @property {string} batchId
 * @property {object[]} [sourceDocuments]
 */

/**
 * @typedef {Object} SourceReader
 * @property {(source: MigrationSourceDescriptor, boundary?: MigrationBatchBoundary) => Promise<{ documents: object[], nextBoundary: MigrationBatchBoundary | null }>} readBatch
 * @property {() => Promise<void>} close
 */

/**
 * @typedef {Object} DocumentTransformer
 * @property {(sourceDoc: object, context: MigrationTransformContext) => { document: object, auditEntries: AuditRecord[], diagnostics: object[] }} transformDocument
 */

/**
 * @typedef {Object} TargetBatchWriter
 * @property {(collection: string, documents: object[], context: MigrationWriteContext) => Promise<MigrationBatchResult>} writeBatch
 */

/**
 * @typedef {Object} CheckpointWriter
 * @property {(runId: string, collection: string, batchId: string) => Promise<CheckpointRecord | null>} getCheckpoint
 * @property {(record: CheckpointRecord) => Promise<void>} markBatchStarted
 * @property {(record: CheckpointRecord) => Promise<void>} markBatchCompleted
 * @property {(record: CheckpointRecord) => Promise<void>} markBatchFailed
 * @property {(runId: string, collection: string) => Promise<CheckpointRecord[]>} listCompletedBatches
 */

/**
 * @typedef {Object} AuditWriter
 * @property {(records: AuditRecord[]) => Promise<void>} append
 * @property {() => Promise<void>} flush
 * @property {() => string} getArtifactPath
 */

class MigrationContractError extends Error {
    /**
     * @param {string} message
     * @param {string} code
     * @param {Record<string, unknown>} [metadata]
     */
    constructor(message, code, metadata) {
        super(message);
        this.name = "MigrationContractError";
        this.code = code;
        this.metadata = metadata || {};
    }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} factoryName
 * @returns {string}
 */
function requireNonEmptyString(value, fieldName, factoryName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new MigrationContractError(
            `${factoryName} requires a non-empty ${fieldName}`,
            MIGRATION_CONTRACT_INVALID_CONFIG,
            { factory: factoryName, field: fieldName }
        );
    }
    return value;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} factoryName
 */
function requireObject(value, fieldName, factoryName) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new MigrationContractError(
            `${factoryName} requires ${fieldName}`,
            MIGRATION_CONTRACT_INVALID_CONFIG,
            { factory: factoryName, field: fieldName }
        );
    }
}

/**
 * @param {unknown} value
 * @param {string} label
 * @param {readonly string[]} allowed
 */
function assertEnum(value, label, allowed) {
    if (typeof value !== "string" || !allowed.includes(value)) {
        throw new MigrationContractError(
            `${label} must be one of: ${allowed.join(", ")}`,
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: label, value }
        );
    }
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function assertStringArray(value, label) {
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        throw new MigrationContractError(
            `${label} must be an array of strings`,
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: label }
        );
    }
}

/**
 * @param {unknown} value
 * @returns {asserts value is MigrationRunIdentity}
 */
function validateMigrationRunIdentity(value) {
    requireObject(value, "runIdentity", "MigrationRunIdentity");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.runId, "runId", "MigrationRunIdentity");
    requireNonEmptyString(record.sourceDatabaseIdentity, "sourceDatabaseIdentity", "MigrationRunIdentity");
    requireNonEmptyString(record.targetDatabaseIdentity, "targetDatabaseIdentity", "MigrationRunIdentity");
}

/**
 * @param {unknown} value
 * @returns {asserts value is MigrationSourceDescriptor}
 */
function validateMigrationSourceDescriptor(value) {
    requireObject(value, "source", "MigrationSourceDescriptor");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.resource, "resource", "MigrationSourceDescriptor");
    requireNonEmptyString(record.model, "model", "MigrationSourceDescriptor");
    assertEnum(record.kind, "kind", MIGRATION_SOURCE_KINDS);
    requireNonEmptyString(record.collectionName, "collectionName", "MigrationSourceDescriptor");
}

/**
 * @param {unknown} value
 * @returns {asserts value is MigrationBatchBoundary}
 */
function validateMigrationBatchBoundary(value) {
    requireObject(value, "boundary", "MigrationBatchBoundary");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.batchId, "batchId", "MigrationBatchBoundary");
    requireNonEmptyString(record.collection, "collection", "MigrationBatchBoundary");
    if (typeof record.documentCount !== "number" || record.documentCount < 0) {
        throw new MigrationContractError(
            "MigrationBatchBoundary.documentCount must be a non-negative number",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "documentCount" }
        );
    }
    assertStringArray(record.sourceIds, "sourceIds");
}

/**
 * @param {unknown} value
 * @returns {asserts value is MigrationBatchResult}
 */
function validateMigrationBatchResult(value) {
    requireObject(value, "batchResult", "MigrationBatchResult");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.batchId, "batchId", "MigrationBatchResult");
    assertEnum(record.status, "status", MIGRATION_BATCH_STATUSES);
    if (typeof record.sourceCount !== "number" || record.sourceCount < 0) {
        throw new MigrationContractError(
            "MigrationBatchResult.sourceCount must be a non-negative number",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "sourceCount" }
        );
    }
    if (typeof record.targetCount !== "number" || record.targetCount < 0) {
        throw new MigrationContractError(
            "MigrationBatchResult.targetCount must be a non-negative number",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "targetCount" }
        );
    }
    if (!Array.isArray(record.errors)) {
        throw new MigrationContractError(
            "MigrationBatchResult.errors must be an array",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "errors" }
        );
    }
}

/**
 * @param {unknown} value
 * @returns {asserts value is AuditRecord}
 */
function validateAuditRecord(value) {
    requireObject(value, "auditRecord", "AuditRecord");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.sourceDatabaseIdentity, "sourceDatabaseIdentity", "AuditRecord");
    requireNonEmptyString(record.sourceCollection, "sourceCollection", "AuditRecord");
    requireNonEmptyString(record.fhirPath, "fhirPath", "AuditRecord");
    assertEnum(record.temporalType, "temporalType", TEMPORAL_TYPES);
    requireNonEmptyString(record.policy, "policy", "AuditRecord");
    if (!Object.prototype.hasOwnProperty.call(record, "sourceDocumentId")) {
        throw new MigrationContractError(
            "AuditRecord requires sourceDocumentId",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "sourceDocumentId" }
        );
    }
    if (!Object.prototype.hasOwnProperty.call(record, "originalValue")) {
        throw new MigrationContractError(
            "AuditRecord requires originalValue",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "originalValue" }
        );
    }
    if (!Object.prototype.hasOwnProperty.call(record, "generatedValue")) {
        throw new MigrationContractError(
            "AuditRecord requires generatedValue",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "generatedValue" }
        );
    }
}

/**
 * @param {unknown} value
 * @returns {asserts value is CheckpointRecord}
 */
function validateCheckpointRecord(value) {
    requireObject(value, "checkpointRecord", "CheckpointRecord");
    const record = /** @type {Record<string, unknown>} */ (value);
    requireNonEmptyString(record.runId, "runId", "CheckpointRecord");
    requireNonEmptyString(record.collection, "collection", "CheckpointRecord");
    requireNonEmptyString(record.batchId, "batchId", "CheckpointRecord");
    assertEnum(record.status, "status", CHECKPOINT_STATUSES);
    requireObject(record.counts, "counts", "CheckpointRecord");
    const counts = /** @type {Record<string, unknown>} */ (record.counts);
    for (const key of ["sourceCount", "targetCount"]) {
        if (
            Object.prototype.hasOwnProperty.call(counts, key) &&
            (typeof counts[key] !== "number" || /** @type {number} */ (counts[key]) < 0)
        ) {
            throw new MigrationContractError(
                `CheckpointRecord.counts.${key} must be a non-negative number when present`,
                MIGRATION_CONTRACT_INVALID_SHAPE,
                { field: `counts.${key}` }
            );
        }
    }
    if (
        record.errorMetadata !== undefined &&
        (record.errorMetadata === null ||
            typeof record.errorMetadata !== "object" ||
            Array.isArray(record.errorMetadata))
    ) {
        throw new MigrationContractError(
            "CheckpointRecord.errorMetadata must be an object when present",
            MIGRATION_CONTRACT_INVALID_SHAPE,
            { field: "errorMetadata" }
        );
    }
}

/**
 * @param {unknown} value
 * @returns {asserts value is MigrationWriteContext}
 */
function validateMigrationWriteContext(value) {
    requireObject(value, "context", "MigrationWriteContext");
    const record = /** @type {Record<string, unknown>} */ (value);
    validateMigrationRunIdentity(record.runIdentity);
    validateMigrationSourceDescriptor(record.source);
    requireNonEmptyString(record.batchId, "batchId", "MigrationWriteContext");
}

module.exports = {
    MIGRATION_CONTRACT_INVALID_CONFIG,
    MIGRATION_CONTRACT_INVALID_SHAPE,
    MIGRATION_CONTRACT_NOT_IMPLEMENTED,
    MIGRATION_SOURCE_KINDS,
    MIGRATION_BATCH_STATUSES,
    CHECKPOINT_STATUSES,
    TEMPORAL_TYPES,
    MigrationContractError,
    validateMigrationRunIdentity,
    validateMigrationSourceDescriptor,
    validateMigrationBatchBoundary,
    validateMigrationBatchResult,
    validateAuditRecord,
    validateCheckpointRecord,
    validateMigrationWriteContext,
    validateTransformedDocument,
    validateTransformedBatch
};
