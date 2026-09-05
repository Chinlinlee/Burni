"use strict";

const MANIFEST_VERSION = 1;
const MANIFEST_KIND = "mongodb-desired-index-manifest";
const CHECKSUM_ALGORITHM = "sha256";

const MODEL_KINDS = Object.freeze({
    RESOURCE: "resource",
    HISTORY: "history",
    STATIC: "static"
});

const INDEX_SOURCES = Object.freeze({
    SCHEMA: "schema",
    SERVICE: "service",
    TEMPORAL: "temporal"
});

const INDEX_DRIFT_TYPES = Object.freeze({
    MISSING: "missing",
    EXTRA: "extra",
    COMPATIBLE: "compatible",
    MISMATCH: "mismatch"
});

const COLLECTION_RECONCILE_STATUS = Object.freeze({
    CREATED: "created",
    ALREADY_EXISTING: "already-existing",
    MISSING: "missing",
    FAILED: "failed"
});

const INDEX_RECONCILE_STATUS = Object.freeze({
    CREATED: "created",
    COMPATIBLE: "compatible",
    MISSING: "missing",
    EXTRA: "extra",
    MISMATCH: "mismatch"
});

const PROVISIONING_PHASES = Object.freeze({
    CONTROL_PLANE: "control-plane",
    COLLECTIONS: "collections",
    BASELINE_INDEXES: "baseline-indexes",
    TEMPORAL_INDEXES: "temporal-indexes",
    VERIFY: "verify"
});

const PROVISIONING_PHASE_STATUS = Object.freeze({
    SUCCEEDED: "succeeded",
    FAILED: "failed",
    SKIPPED: "skipped"
});

const PROVISIONING_RUN_STATUS = Object.freeze({
    RUNNING: "running",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
    PARTIAL: "partial",
    LOCK_CONFLICT: "lock-conflict"
});

const CONTROL_PLANE_COLLECTIONS = Object.freeze({
    LOCK: "MongoProvisioningLock",
    STATE: "MongoProvisioningState"
});

const DEFAULT_LOCK_LEASE_MS = 5 * 60 * 1000;

/**
 * @param {string} modelKind
 * @returns {boolean}
 */
function isModelKind(modelKind) {
    return Object.values(MODEL_KINDS).includes(modelKind);
}

/**
 * @param {string} source
 * @returns {boolean}
 */
function isBaselineIndexSource(source) {
    return source === INDEX_SOURCES.SCHEMA || source === INDEX_SOURCES.SERVICE;
}

/**
 * @param {Object} input
 * @param {string} input.collection
 * @param {string} input.modelName
 * @param {"resource" | "history" | "static"} input.modelKind
 * @param {string} [input.resourceType]
 * @returns {import('./types').CollectionContract}
 */
function createCollectionContract(input) {
    const contract = {
        collection: input.collection,
        modelName: input.modelName,
        modelKind: input.modelKind
    };
    if (input.resourceType) {
        contract.resourceType = input.resourceType;
    }
    assertCollectionContract(contract);
    return contract;
}

/**
 * @param {Object} input
 * @returns {import('./types').BaselineIndexContract}
 */
function createBaselineIndexContract(input) {
    const contract = {
        collection: input.collection,
        key: input.key,
        options: input.options || {},
        name: input.name,
        source: input.source,
        identity: input.identity
    };
    assertBaselineIndexContract(contract);
    return contract;
}

/**
 * @param {Object} input
 * @returns {import('./types').DerivedIndexContract}
 */
function createDerivedIndexContract(input) {
    const contract = {
        collection: input.collection,
        key: input.key,
        options: input.options || {},
        name: input.name,
        source: INDEX_SOURCES.TEMPORAL,
        identity: input.identity,
        temporal: input.temporal
    };
    assertDerivedIndexContract(contract);
    return contract;
}

/**
 * @param {string} value
 * @param {string} [algorithm]
 * @returns {import('./types').ManifestChecksum}
 */
function createManifestChecksum(value, algorithm = CHECKSUM_ALGORITHM) {
    if (!value || typeof value !== "string") {
        throw new TypeError("Manifest checksum value must be a non-empty string");
    }
    return {
        algorithm,
        value
    };
}

/**
 * @param {Object} input
 * @returns {import('./types').ReconcileResult}
 */
function createReconcileResult(input) {
    const result = {
        manifestChecksum: input.manifestChecksum,
        manifestVersion: input.manifestVersion,
        verified: Boolean(input.verified),
        collections: Array.isArray(input.collections) ? input.collections : [],
        indexes: Array.isArray(input.indexes) ? input.indexes : [],
        summary: input.summary || {},
        errors: Array.isArray(input.errors) ? input.errors : []
    };
    assertReconcileResult(result);
    return result;
}

/**
 * @param {import('./types').CollectionContract} contract
 */
function assertCollectionContract(contract) {
    if (!contract || typeof contract !== "object") {
        throw new TypeError("Collection contract must be an object");
    }
    if (!contract.collection || typeof contract.collection !== "string") {
        throw new TypeError("Collection contract requires collection");
    }
    if (!contract.modelName || typeof contract.modelName !== "string") {
        throw new TypeError("Collection contract requires modelName");
    }
    if (!isModelKind(contract.modelKind)) {
        throw new TypeError(`Collection contract has invalid modelKind: ${contract.modelKind}`);
    }
    if (
        contract.resourceType !== undefined &&
        typeof contract.resourceType !== "string"
    ) {
        throw new TypeError("Collection contract resourceType must be a string");
    }
}

/**
 * @param {import('./types').BaselineIndexContract} contract
 */
function assertBaselineIndexContract(contract) {
    if (!contract || typeof contract !== "object") {
        throw new TypeError("Baseline index contract must be an object");
    }
    if (!contract.collection || typeof contract.collection !== "string") {
        throw new TypeError("Baseline index contract requires collection");
    }
    if (!contract.key || typeof contract.key !== "object" || Array.isArray(contract.key)) {
        throw new TypeError("Baseline index contract requires key object");
    }
    if (!contract.name || typeof contract.name !== "string") {
        throw new TypeError("Baseline index contract requires name");
    }
    if (!isBaselineIndexSource(contract.source)) {
        throw new TypeError(`Baseline index contract has invalid source: ${contract.source}`);
    }
    if (!contract.identity || typeof contract.identity !== "string") {
        throw new TypeError("Baseline index contract requires identity");
    }
}

/**
 * @param {import('./types').DerivedIndexContract} contract
 */
function assertDerivedIndexContract(contract) {
    if (!contract || typeof contract !== "object") {
        throw new TypeError("Derived index contract must be an object");
    }
    if (!contract.collection || typeof contract.collection !== "string") {
        throw new TypeError("Derived index contract requires collection");
    }
    if (!contract.key || typeof contract.key !== "object" || Array.isArray(contract.key)) {
        throw new TypeError("Derived index contract requires key object");
    }
    if (!contract.name || typeof contract.name !== "string") {
        throw new TypeError("Derived index contract requires name");
    }
    if (contract.source !== INDEX_SOURCES.TEMPORAL) {
        throw new TypeError("Derived index contract source must be temporal");
    }
    if (!contract.identity || typeof contract.identity !== "string") {
        throw new TypeError("Derived index contract requires identity");
    }
    if (!contract.temporal || typeof contract.temporal !== "object") {
        throw new TypeError("Derived index contract requires temporal metadata");
    }
}

/**
 * @param {import('./types').ReconcileResult} result
 */
function assertReconcileResult(result) {
    if (!result || typeof result !== "object") {
        throw new TypeError("Reconcile result must be an object");
    }
    if (!result.manifestChecksum || typeof result.manifestChecksum !== "string") {
        throw new TypeError("Reconcile result requires manifestChecksum");
    }
    if (typeof result.manifestVersion !== "number") {
        throw new TypeError("Reconcile result requires manifestVersion");
    }
    if (!Array.isArray(result.collections) || !Array.isArray(result.indexes)) {
        throw new TypeError("Reconcile result requires collections and indexes arrays");
    }
    if (!result.summary || typeof result.summary !== "object") {
        throw new TypeError("Reconcile result requires summary");
    }
    if (!Array.isArray(result.errors)) {
        throw new TypeError("Reconcile result requires errors array");
    }
}

/**
 * @param {Object} input
 * @returns {import('./types').ProvisioningPhaseResult}
 */
function createProvisioningPhaseResult(input) {
    const result = {
        phase: input.phase,
        status: input.status,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        summary: input.summary || {},
        errors: Array.isArray(input.errors) ? input.errors : []
    };
    assertProvisioningPhaseResult(result);
    return result;
}

/**
 * @param {Object} input
 * @returns {import('./types').ProvisioningDriftSummary}
 */
function createProvisioningDriftSummary(input = {}) {
    return {
        collectionsFailed: input.collectionsFailed || 0,
        indexesMissing: input.indexesMissing || 0,
        indexesExtra: input.indexesExtra || 0,
        indexesMismatch: input.indexesMismatch || 0
    };
}

/**
 * @param {import('./types').ProvisioningPhaseResult} result
 */
function assertProvisioningPhaseResult(result) {
    if (!result || typeof result !== "object") {
        throw new TypeError("Provisioning phase result must be an object");
    }
    if (!Object.values(PROVISIONING_PHASES).includes(result.phase)) {
        throw new TypeError(`Provisioning phase result has invalid phase: ${result.phase}`);
    }
    if (!Object.values(PROVISIONING_PHASE_STATUS).includes(result.status)) {
        throw new TypeError(`Provisioning phase result has invalid status: ${result.status}`);
    }
    if (!(result.startedAt instanceof Date) || !(result.completedAt instanceof Date)) {
        throw new TypeError("Provisioning phase result requires Date timestamps");
    }
    if (!result.summary || typeof result.summary !== "object") {
        throw new TypeError("Provisioning phase result requires summary");
    }
    if (!Array.isArray(result.errors)) {
        throw new TypeError("Provisioning phase result requires errors array");
    }
}

module.exports = {
    MANIFEST_VERSION,
    MANIFEST_KIND,
    CHECKSUM_ALGORITHM,
    MODEL_KINDS,
    INDEX_SOURCES,
    INDEX_DRIFT_TYPES,
    COLLECTION_RECONCILE_STATUS,
    INDEX_RECONCILE_STATUS,
    PROVISIONING_PHASES,
    PROVISIONING_PHASE_STATUS,
    PROVISIONING_RUN_STATUS,
    CONTROL_PLANE_COLLECTIONS,
    DEFAULT_LOCK_LEASE_MS,
    createProvisioningPhaseResult,
    createProvisioningDriftSummary,
    createCollectionContract,
    createBaselineIndexContract,
    createDerivedIndexContract,
    createManifestChecksum,
    createReconcileResult,
    assertCollectionContract,
    assertBaselineIndexContract,
    assertDerivedIndexContract,
    assertReconcileResult
};
