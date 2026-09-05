"use strict";

/**
 * @typedef {"resource" | "history" | "static"} ModelKind
 */

/**
 * @typedef {Object} CollectionContract
 * @property {string} collection
 * @property {string} modelName
 * @property {ModelKind} modelKind
 * @property {string} [resourceType]
 */

/**
 * @typedef {Object} ModelCatalog
 * @property {number} resourceCount
 * @property {number} historyCount
 * @property {number} staticCount
 * @property {number} collectionCount
 * @property {CollectionContract[]} entries
 */

/**
 * @typedef {"schema" | "service"} BaselineIndexSource
 */

/**
 * @typedef {Object} BaselineIndexContract
 * @property {string} collection
 * @property {Record<string, number>} key
 * @property {Record<string, unknown>} options
 * @property {string} name
 * @property {BaselineIndexSource} source
 * @property {string} identity
 */

/**
 * @typedef {Object} DerivedIndexTemporalMetadata
 * @property {string} resourceType
 * @property {string} extractionPath
 * @property {string} datatype
 * @property {string} indexKind
 * @property {string} bsonType
 * @property {string} valueShape
 * @property {string[]} lookupKeys
 * @property {string[]} canonicalKeys
 */

/**
 * @typedef {Object} DerivedIndexContract
 * @property {string} collection
 * @property {Record<string, number>} key
 * @property {Record<string, unknown>} options
 * @property {string} name
 * @property {"temporal"} source
 * @property {string} identity
 * @property {DerivedIndexTemporalMetadata} temporal
 */

/**
 * @typedef {Object} ManifestChecksum
 * @property {string} algorithm
 * @property {string} value
 */

/**
 * @typedef {Object} DesiredManifestCounts
 * @property {number} collections
 * @property {number} baselineIndexes
 * @property {number} derivedIndexes
 */

/**
 * @typedef {Object} DesiredManifest
 * @property {number} version
 * @property {string} kind
 * @property {string} generatedAt
 * @property {ManifestChecksum} checksum
 * @property {import('../../FHIR/searchParameter/registry/artifacts/artifactIdentity').ArtifactIdentity} artifactIdentity
 * @property {CollectionContract[]} collections
 * @property {BaselineIndexContract[]} baselineIndexes
 * @property {DerivedIndexContract[]} derivedIndexes
 * @property {DesiredManifestCounts} counts
 * @property {string[]} temporalDiagnostics
 */

/**
 * @typedef {"missing" | "extra" | "compatible" | "mismatch"} IndexDriftType
 */

/**
 * @typedef {Object} CollectionReconcileEntry
 * @property {string} collection
 * @property {"created" | "already-existing" | "missing" | "failed"} status
 * @property {string} [error]
 */

/**
 * @typedef {Object} IndexDriftDetail
 * @property {IndexDriftType} type
 * @property {Record<string, unknown>} [expected]
 * @property {Record<string, unknown>} [actual]
 * @property {string} [message]
 */

/**
 * @typedef {Object} IndexReconcileEntry
 * @property {string} collection
 * @property {string} name
 * @property {string} identity
 * @property {"created" | "compatible" | "missing" | "extra" | "mismatch"} status
 * @property {IndexDriftDetail} [drift]
 */

/**
 * @typedef {Object} ReconcileSummary
 * @property {number} [collectionsCreated]
 * @property {number} [collectionsExisting]
 * @property {number} [collectionsMissing]
 * @property {number} [collectionsFailed]
 * @property {number} [indexesCreated]
 * @property {number} [indexesCompatible]
 * @property {number} [indexesMissing]
 * @property {number} [indexesExtra]
 * @property {number} [indexesMismatch]
 */

/**
 * @typedef {Object} ReconcileResult
 * @property {string} manifestChecksum
 * @property {number} manifestVersion
 * @property {boolean} verified
 * @property {CollectionReconcileEntry[]} collections
 * @property {IndexReconcileEntry[]} indexes
 * @property {ReconcileSummary} summary
 * @property {string[]} errors
 */

/**
 * @typedef {Object} IdentityDuplicateDocumentRef
 * @property {string} objectId
 * @property {string} [versionId]
 * @property {string} [resourceType]
 */

/**
 * @typedef {Object} IdentityDuplicateGroup
 * @property {string} collection
 * @property {string} resourceType
 * @property {ModelKind} modelKind
 * @property {string} id
 * @property {number} count
 * @property {IdentityDuplicateDocumentRef[]} documents
 */

/**
 * @typedef {Object} IdentityDuplicateAuditSummary
 * @property {number} duplicateIdCount
 * @property {number} duplicateDocumentCount
 * @property {string[]} collectionsWithDuplicates
 * @property {Record<string, { duplicateIds: number, duplicateDocuments: number }>} byCollection
 */

/**
 * @typedef {Object} IdentityDuplicateAuditReport
 * @property {boolean} clean
 * @property {boolean} hasDuplicates
 * @property {number} scannedCollections
 * @property {string[]} skippedCollections
 * @property {IdentityDuplicateGroup[]} duplicates
 * @property {IdentityDuplicateAuditSummary} summary
 */

/**
 * @typedef {Object} IdentityCleanAuditGateResult
 * @property {boolean} clean
 * @property {boolean} allowed
 * @property {string} [reason]
 * @property {number} [duplicateIdCount]
 * @property {number} [duplicateDocumentCount]
 */

/**
 * @typedef {Object} IdentityUniqueMigrationIndexResult
 * @property {string} collection
 * @property {string} resourceType
 * @property {ModelKind} modelKind
 * @property {string} name
 * @property {"created" | "already-unique"} status
 */

/**
 * @typedef {Object} IdentityUniqueMigrationResult
 * @property {"succeeded" | "blocked" | "failed"} status
 * @property {IdentityCleanAuditGateResult} gate
 * @property {IdentityDuplicateAuditReport} auditReport
 * @property {IdentityUniqueMigrationIndexResult[]} indexesCreated
 * @property {IdentityUniqueMigrationIndexResult[]} indexesSkipped
 * @property {string[]} errors
 */

/**
 * @typedef {"control-plane" | "collections" | "baseline-indexes" | "temporal-indexes" | "verify"} ProvisioningPhase
 */

/**
 * @typedef {"succeeded" | "failed" | "skipped"} ProvisioningPhaseStatus
 */

/**
 * @typedef {"running" | "succeeded" | "failed" | "partial" | "lock-conflict"} ProvisioningRunStatus
 */

/**
 * @typedef {Object} ProvisioningPhaseResult
 * @property {ProvisioningPhase} phase
 * @property {ProvisioningPhaseStatus} status
 * @property {Date} startedAt
 * @property {Date} completedAt
 * @property {ReconcileSummary} summary
 * @property {string[]} errors
 */

/**
 * @typedef {Object} ProvisioningDriftSummary
 * @property {number} collectionsFailed
 * @property {number} indexesMissing
 * @property {number} indexesExtra
 * @property {number} indexesMismatch
 */

/**
 * @typedef {Object} ProvisioningLockDocument
 * @property {string} databaseIdentity
 * @property {string} ownerId
 * @property {string} runId
 * @property {Date} acquiredAt
 * @property {Date} expiresAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ProvisioningStateDocument
 * @property {string} databaseIdentity
 * @property {string} runId
 * @property {string} manifestChecksum
 * @property {number} manifestVersion
 * @property {ProvisioningPhase} phase
 * @property {ProvisioningRunStatus} status
 * @property {Date} startedAt
 * @property {Date} updatedAt
 * @property {Date} [completedAt]
 * @property {ProvisioningPhaseResult[]} phaseResults
 * @property {ProvisioningDriftSummary} driftSummary
 * @property {string[]} errors
 */

/**
 * @typedef {Object} ProvisioningLockAcquireResult
 * @property {boolean} acquired
 * @property {ProvisioningLockDocument} [lock]
 * @property {boolean} [renewed]
 * @property {boolean} [reclaimed]
 * @property {boolean} [conflict]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} LockedProvisioningRunResult
 * @property {string} runId
 * @property {string} databaseIdentity
 * @property {string} ownerId
 * @property {ProvisioningRunStatus} status
 * @property {ProvisioningPhase} phase
 * @property {string} manifestChecksum
 * @property {number} manifestVersion
 * @property {ProvisioningPhaseResult[]} phaseResults
 * @property {ProvisioningDriftSummary} driftSummary
 * @property {string[]} errors
 * @property {ReconcileResult} [reconcileResult]
 * @property {ProvisioningStateDocument} [state]
 * @property {ProvisioningLockDocument} [conflictingLock]
 */

module.exports = {};
