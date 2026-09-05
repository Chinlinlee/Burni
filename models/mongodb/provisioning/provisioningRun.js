"use strict";

const crypto = require("crypto");
const {
    COLLECTION_RECONCILE_STATUS,
    INDEX_RECONCILE_STATUS,
    PROVISIONING_PHASES,
    PROVISIONING_PHASE_STATUS,
    PROVISIONING_RUN_STATUS,
    DEFAULT_LOCK_LEASE_MS,
    createProvisioningDriftSummary
} = require("./contracts");
const { ensureControlPlaneCollections } = require("./controlPlaneModels");
const {
    provisionCollections,
    inspectCollections,
    summarizeCollectionResults
} = require("./collectionProvisioner");
const { reconcileIndexes, summarizeIndexResults } = require("./indexReconciler");
const {
    buildReconcileResult,
    resolveManifest,
    resolveDdlClient
} = require("./provisioningService");
const {
    acquireProvisioningLock,
    releaseProvisioningLock,
    createProvisioningLockStore
} = require("./provisioningLock");
const {
    beginProvisioningRun,
    recordProvisioningPhaseResult,
    finalizeProvisioningRun,
    driftSummaryFromReconcileSummary,
    createProvisioningStateStore
} = require("./provisioningState");

/**
 * @param {import("mongodb").Db} db
 * @returns {string}
 */
function resolveDatabaseIdentity(db, options = {}) {
    if (options.databaseIdentity) {
        return options.databaseIdentity;
    }
    if (!db || typeof db.databaseName !== "string" || db.databaseName.length === 0) {
        throw new Error("Mongo provisioning requires database identity");
    }
    return db.databaseName;
}

/**
 * @param {Object} [options]
 * @returns {string}
 */
function resolveOwnerId(options = {}) {
    if (options.ownerId) {
        return options.ownerId;
    }
    const host = process.env.HOSTNAME || "local";
    return `${host}:${process.pid}`;
}

/**
 * @param {Object} [options]
 * @returns {string}
 */
function resolveRunId(options = {}) {
    return options.runId || crypto.randomUUID();
}

/**
 * @param {import('./types').CollectionReconcileEntry[]} collections
 * @returns {{ failed: boolean, errors: string[] }}
 */
function evaluateCollectionPhase(collections) {
    /** @type {string[]} */
    const errors = [];
    for (const entry of collections) {
        if (entry.status === COLLECTION_RECONCILE_STATUS.FAILED) {
            errors.push(`${entry.collection}: ${entry.error || "collection provisioning failed"}`);
        }
    }
    return {
        failed: errors.length > 0,
        errors
    };
}

/**
 * @param {import('./types').IndexReconcileEntry[]} indexes
 * @returns {{ failed: boolean, errors: string[] }}
 */
function evaluateIndexProvisionPhase(indexes) {
    /** @type {string[]} */
    const errors = [];
    for (const entry of indexes) {
        if (entry.status === INDEX_RECONCILE_STATUS.MISMATCH) {
            errors.push(`${entry.collection}.${entry.name}: ${entry.drift?.message || "index mismatch"}`);
        }
    }
    return {
        failed: errors.length > 0,
        errors
    };
}

/**
 * @param {import('./types').ReconcileResult} reconcileResult
 * @returns {{ failed: boolean, errors: string[] }}
 */
function evaluateVerifyPhase(reconcileResult) {
    return {
        failed: !reconcileResult.verified,
        errors: reconcileResult.errors
    };
}

/**
 * @param {Object} options
 * @param {import('./types').ProvisioningPhase} options.phase
 * @param {() => Promise<{ summary: import('./types').ReconcileSummary, errors: string[], failed: boolean, reconcile?: import('./types').ReconcileResult }>} options.execute
 * @param {import('./provisioningState').ProvisioningStateStore} options.stateStore
 * @param {string} options.databaseIdentity
 * @param {string} options.runId
 * @param {Date} [options.now]
 * @returns {Promise<{ phaseResult: import('./types').ProvisioningPhaseResult, failed: boolean, reconcile?: import('./types').ReconcileResult }>}
 */
async function runProvisioningPhase(options) {
    const startedAt = options.now ?? new Date();
    const outcome = await options.execute();
    const completedAt = new Date();
    const phaseResult = {
        phase: options.phase,
        status: outcome.failed
            ? PROVISIONING_PHASE_STATUS.FAILED
            : PROVISIONING_PHASE_STATUS.SUCCEEDED,
        startedAt,
        completedAt,
        summary: outcome.summary,
        errors: outcome.errors
    };

    await recordProvisioningPhaseResult(options.stateStore, {
        databaseIdentity: options.databaseIdentity,
        runId: options.runId,
        phase: options.phase,
        status: phaseResult.status,
        startedAt,
        completedAt,
        summary: outcome.summary,
        errors: outcome.errors,
        driftSummary: driftSummaryFromReconcileSummary(outcome.summary),
        now: completedAt
    });

    return {
        phaseResult,
        failed: outcome.failed,
        reconcile: outcome.reconcile
    };
}

/**
 * @param {Object} options
 * @param {import("mongodb").Db} [options.db]
 * @param {import("mongoose").Connection} [options.connection]
 * @param {import('./mongoDdlClient').MongoDdlClient} [options.ddlClient]
 * @param {Record<string, import("mongoose").Model>} [options.modelMap]
 * @param {import('./types').DesiredManifest} [options.manifest]
 * @param {boolean} [options.skipTemporalValidation]
 * @param {string} [options.databaseIdentity]
 * @param {string} [options.ownerId]
 * @param {string} [options.runId]
 * @param {number} [options.lockLeaseMs]
 * @param {import('./provisioningLock').ProvisioningLockStore} [options.lockStore]
 * @param {import('./provisioningState').ProvisioningStateStore} [options.stateStore]
 * @param {import("mongoose").Model} [options.lockModel]
 * @param {import("mongoose").Model} [options.stateModel]
 * @param {boolean} [options.releaseLockOnFailure]
 * @returns {Promise<import('./types').LockedProvisioningRunResult>}
 */
async function runLockedMongoProvisioning(options = {}) {
    const db = options.db || options.connection?.db;
    if (!db) {
        throw new Error("Locked Mongo provisioning requires db or connection");
    }

    const databaseIdentity = resolveDatabaseIdentity(db, options);
    const ownerId = resolveOwnerId(options);
    const runId = resolveRunId(options);
    const leaseMs = options.lockLeaseMs ?? DEFAULT_LOCK_LEASE_MS;
    const manifest = resolveManifest(options);
    const ddlClient = resolveDdlClient(options);
    const lockStore =
        options.lockStore ||
        (options.lockModel ? createProvisioningLockStore(options.lockModel) : null);
    const stateStore =
        options.stateStore ||
        (options.stateModel ? createProvisioningStateStore(options.stateModel) : null);

    if (!lockStore || !stateStore) {
        throw new Error("Locked Mongo provisioning requires lockStore/stateStore or models");
    }

    /** @type {import('./types').ProvisioningPhaseResult[]} */
    const phaseResults = [];
    let reconcileResult;
    let acquiredLock = false;

    await ensureControlPlaneCollections(db);

    const lockResult = await acquireProvisioningLock(lockStore, {
        databaseIdentity,
        ownerId,
        runId,
        leaseMs
    });

    if (!lockResult.acquired) {
        return {
            runId,
            databaseIdentity,
            ownerId,
            status: PROVISIONING_RUN_STATUS.LOCK_CONFLICT,
            phase: PROVISIONING_PHASES.CONTROL_PLANE,
            manifestChecksum: manifest.checksum.value,
            manifestVersion: manifest.version,
            phaseResults,
            driftSummary: createProvisioningDriftSummary(),
            errors: [
                lockResult.reason === "held-by-other-owner"
                    ? `Provisioning lock held by ${lockResult.lock?.ownerId}`
                    : "Provisioning lock acquisition race lost"
            ],
            conflictingLock: lockResult.lock
        };
    }

    acquiredLock = true;

    await beginProvisioningRun(stateStore, {
        databaseIdentity,
        runId,
        manifestChecksum: manifest.checksum.value,
        manifestVersion: manifest.version
    });

    try {
        const collectionsPhase = await runProvisioningPhase({
            phase: PROVISIONING_PHASES.COLLECTIONS,
            databaseIdentity,
            runId,
            stateStore,
            execute: async () => {
                const collections = await provisionCollections(manifest.collections, ddlClient);
                const summary = summarizeCollectionResults(collections);
                const evaluation = evaluateCollectionPhase(collections);
                return {
                    summary,
                    errors: evaluation.errors,
                    failed: evaluation.failed,
                    reconcile: buildReconcileResult({
                        manifest,
                        collections,
                        indexes: []
                    })
                };
            }
        });
        phaseResults.push(collectionsPhase.phaseResult);
        if (collectionsPhase.failed) {
            return await finishFailedRun({
                stateStore,
                databaseIdentity,
                ownerId,
                runId,
                manifest,
                phase: PROVISIONING_PHASES.COLLECTIONS,
                phaseResults,
                errors: collectionsPhase.phaseResult.errors,
                driftSummary: driftSummaryFromReconcileSummary(collectionsPhase.phaseResult.summary)
            });
        }

        const baselinePhase = await runProvisioningPhase({
            phase: PROVISIONING_PHASES.BASELINE_INDEXES,
            databaseIdentity,
            runId,
            stateStore,
            execute: async () => {
                const indexes = await reconcileIndexes(manifest.baselineIndexes, ddlClient, {
                    mode: "provision"
                });
                const summary = summarizeIndexResults(indexes);
                const evaluation = evaluateIndexProvisionPhase(indexes);
                return {
                    summary,
                    errors: evaluation.errors,
                    failed: evaluation.failed
                };
            }
        });
        phaseResults.push(baselinePhase.phaseResult);
        if (baselinePhase.failed) {
            return await finishFailedRun({
                stateStore,
                databaseIdentity,
                ownerId,
                runId,
                manifest,
                phase: PROVISIONING_PHASES.BASELINE_INDEXES,
                phaseResults,
                errors: baselinePhase.phaseResult.errors,
                driftSummary: driftSummaryFromReconcileSummary(baselinePhase.phaseResult.summary)
            });
        }

        const temporalPhase = await runProvisioningPhase({
            phase: PROVISIONING_PHASES.TEMPORAL_INDEXES,
            databaseIdentity,
            runId,
            stateStore,
            execute: async () => {
                const indexes = await reconcileIndexes(manifest.derivedIndexes, ddlClient, {
                    mode: "provision"
                });
                const summary = summarizeIndexResults(indexes);
                const evaluation = evaluateIndexProvisionPhase(indexes);
                return {
                    summary,
                    errors: evaluation.errors,
                    failed: evaluation.failed
                };
            }
        });
        phaseResults.push(temporalPhase.phaseResult);
        if (temporalPhase.failed) {
            return await finishFailedRun({
                stateStore,
                databaseIdentity,
                ownerId,
                runId,
                manifest,
                phase: PROVISIONING_PHASES.TEMPORAL_INDEXES,
                phaseResults,
                errors: temporalPhase.phaseResult.errors,
                driftSummary: driftSummaryFromReconcileSummary(temporalPhase.phaseResult.summary)
            });
        }

        const verifyPhase = await runProvisioningPhase({
            phase: PROVISIONING_PHASES.VERIFY,
            databaseIdentity,
            runId,
            stateStore,
            execute: async () => {
                const collections = await inspectCollections(manifest.collections, ddlClient);
                const baselineIndexes = await reconcileIndexes(manifest.baselineIndexes, ddlClient, {
                    mode: "verify"
                });
                const temporalIndexes = await reconcileIndexes(manifest.derivedIndexes, ddlClient, {
                    mode: "verify"
                });
                reconcileResult = buildReconcileResult({
                    manifest,
                    collections,
                    indexes: [...baselineIndexes, ...temporalIndexes]
                });
                const evaluation = evaluateVerifyPhase(reconcileResult);
                return {
                    summary: reconcileResult.summary,
                    errors: evaluation.errors,
                    failed: evaluation.failed,
                    reconcile: reconcileResult
                };
            }
        });
        phaseResults.push(verifyPhase.phaseResult);
        reconcileResult = verifyPhase.reconcile;

        const driftSummary = driftSummaryFromReconcileSummary(reconcileResult?.summary || {});
        const finalStatus = verifyPhase.failed
            ? PROVISIONING_RUN_STATUS.FAILED
            : PROVISIONING_RUN_STATUS.SUCCEEDED;
        const state = await finalizeProvisioningRun(stateStore, {
            databaseIdentity,
            runId,
            phase: PROVISIONING_PHASES.VERIFY,
            status: finalStatus,
            driftSummary,
            errors: verifyPhase.phaseResult.errors
        });

        return {
            runId,
            databaseIdentity,
            ownerId,
            status: finalStatus,
            phase: PROVISIONING_PHASES.VERIFY,
            manifestChecksum: manifest.checksum.value,
            manifestVersion: manifest.version,
            phaseResults,
            driftSummary,
            errors: state.errors,
            reconcileResult,
            state
        };
    } finally {
        if (acquiredLock) {
            await releaseProvisioningLock(lockStore, {
                databaseIdentity,
                ownerId
            });
        }
    }
}

/**
 * @param {Object} input
 * @returns {Promise<import('./types').LockedProvisioningRunResult>}
 */
async function finishFailedRun(input) {
    const state = await finalizeProvisioningRun(input.stateStore, {
        databaseIdentity: input.databaseIdentity,
        runId: input.runId,
        phase: input.phase,
        status: PROVISIONING_RUN_STATUS.FAILED,
        driftSummary: input.driftSummary,
        errors: input.errors
    });

    return {
        runId: input.runId,
        databaseIdentity: input.databaseIdentity,
        ownerId: input.ownerId,
        status: PROVISIONING_RUN_STATUS.FAILED,
        phase: input.phase,
        manifestChecksum: input.manifest.checksum.value,
        manifestVersion: input.manifest.version,
        phaseResults: input.phaseResults,
        driftSummary: input.driftSummary,
        errors: state.errors,
        state
    };
}

module.exports = {
    resolveDatabaseIdentity,
    resolveOwnerId,
    resolveRunId,
    evaluateCollectionPhase,
    evaluateIndexProvisionPhase,
    evaluateVerifyPhase,
    runProvisioningPhase,
    runLockedMongoProvisioning
};
