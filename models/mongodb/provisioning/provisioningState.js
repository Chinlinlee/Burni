"use strict";

const {
    PROVISIONING_PHASES,
    PROVISIONING_PHASE_STATUS,
    PROVISIONING_RUN_STATUS,
    createProvisioningDriftSummary,
    createProvisioningPhaseResult
} = require("./contracts");

/**
 * @typedef {Object} ProvisioningStateStore
 * @property {(filter: Record<string, unknown>) => Promise<import('./types').ProvisioningStateDocument | null>} findOne
 * @property {(filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>) => Promise<import('./types').ProvisioningStateDocument | null>} findOneAndUpdate
 */

/**
 * @param {import("mongoose").Model} model
 * @returns {ProvisioningStateStore}
 */
function createProvisioningStateStore(model) {
    const collection = model.collection;
    return {
        findOne: async (filter) => collection.findOne(filter),
        findOneAndUpdate: async (filter, update, options = {}) => {
            const result = await collection.findOneAndUpdate(filter, update, {
                upsert: Boolean(options.upsert),
                returnDocument: "after"
            });
            return result || null;
        }
    };
}

/**
 * @param {import('./types').ReconcileSummary} summary
 * @returns {import('./types').ProvisioningDriftSummary}
 */
function driftSummaryFromReconcileSummary(summary) {
    return createProvisioningDriftSummary({
        collectionsFailed: summary.collectionsFailed || 0,
        indexesMissing: summary.indexesMissing || 0,
        indexesExtra: summary.indexesExtra || 0,
        indexesMismatch: summary.indexesMismatch || 0
    });
}

/**
 * @param {ProvisioningStateStore} store
 * @param {Object} input
 * @returns {Promise<import('./types').ProvisioningStateDocument>}
 */
async function beginProvisioningRun(store, input) {
    const now = input.now ?? new Date();
    const state = await store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity
        },
        {
            $set: {
                databaseIdentity: input.databaseIdentity,
                runId: input.runId,
                manifestChecksum: input.manifestChecksum,
                manifestVersion: input.manifestVersion,
                phase: PROVISIONING_PHASES.CONTROL_PLANE,
                status: PROVISIONING_RUN_STATUS.RUNNING,
                startedAt: now,
                updatedAt: now,
                completedAt: undefined,
                phaseResults: [],
                driftSummary: createProvisioningDriftSummary(),
                errors: []
            }
        },
        {
            upsert: true
        }
    );
    if (!state) {
        throw new Error("Failed to initialize provisioning state");
    }
    return state;
}

/**
 * @param {ProvisioningStateStore} store
 * @param {Object} input
 * @returns {Promise<import('./types').ProvisioningStateDocument>}
 */
async function recordProvisioningPhaseResult(store, input) {
    const now = input.now ?? new Date();
    const phaseResult = createProvisioningPhaseResult({
        phase: input.phase,
        status: input.status,
        startedAt: input.startedAt,
        completedAt: input.completedAt ?? now,
        summary: input.summary || {},
        errors: input.errors || []
    });
    const runStatus =
        input.status === PROVISIONING_PHASE_STATUS.SUCCEEDED
            ? PROVISIONING_RUN_STATUS.RUNNING
            : PROVISIONING_RUN_STATUS.PARTIAL;
    const driftSummary = input.driftSummary || createProvisioningDriftSummary();

    const state = await store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity,
            runId: input.runId
        },
        {
            $set: {
                phase: input.phase,
                status: runStatus,
                updatedAt: now,
                driftSummary
            },
            $push: {
                phaseResults: phaseResult
            }
        }
    );
    if (!state) {
        throw new Error(`Provisioning state not found for run ${input.runId}`);
    }
    return state;
}

/**
 * @param {ProvisioningStateStore} store
 * @param {Object} input
 * @returns {Promise<import('./types').ProvisioningStateDocument>}
 */
async function finalizeProvisioningRun(store, input) {
    const now = input.now ?? new Date();
    const state = await store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity,
            runId: input.runId
        },
        {
            $set: {
                phase: input.phase,
                status: input.status,
                updatedAt: now,
                completedAt: now,
                driftSummary: input.driftSummary,
                errors: input.errors || []
            }
        }
    );
    if (!state) {
        throw new Error(`Provisioning state not found for run ${input.runId}`);
    }
    return state;
}

/**
 * @param {ProvisioningStateStore} store
 * @param {string} databaseIdentity
 * @returns {Promise<import('./types').ProvisioningStateDocument | null>}
 */
async function getLatestProvisioningState(store, databaseIdentity) {
    return store.findOne({ databaseIdentity });
}

/**
 * @param {import('./types').ProvisioningPhaseResult[]} phaseResults
 * @returns {import('./types').ProvisioningPhaseResult[]}
 */
function getSuccessfulPhaseResults(phaseResults) {
    return phaseResults.filter(
        (entry) => entry.status === PROVISIONING_PHASE_STATUS.SUCCEEDED
    );
}

/**
 * @returns {ProvisioningStateStore}
 */
function createInMemoryProvisioningStateStore() {
    /** @type {Map<string, import('./types').ProvisioningStateDocument>} */
    const states = new Map();

    return {
        findOne: async (filter) => {
            if (filter.databaseIdentity && filter.runId) {
                const state = states.get(filter.databaseIdentity);
                if (!state || state.runId !== filter.runId) {
                    return null;
                }
                return { ...state, phaseResults: [...state.phaseResults] };
            }
            if (filter.databaseIdentity) {
                const state = states.get(filter.databaseIdentity);
                return state ? { ...state, phaseResults: [...state.phaseResults] } : null;
            }
            return null;
        },
        findOneAndUpdate: async (filter, update, options = {}) => {
            const existing = states.get(filter.databaseIdentity);
            if (!existing && !options.upsert) {
                return null;
            }
            if (existing && filter.runId && existing.runId !== filter.runId) {
                return null;
            }

            const base = existing || {
                databaseIdentity: filter.databaseIdentity,
                phaseResults: []
            };
            const next = {
                ...base,
                ...(update.$set || {})
            };
            if (update.$push?.phaseResults) {
                next.phaseResults = [...(base.phaseResults || []), update.$push.phaseResults];
            }
            states.set(filter.databaseIdentity, next);
            return { ...next, phaseResults: [...next.phaseResults] };
        }
    };
}

module.exports = {
    createProvisioningStateStore,
    beginProvisioningRun,
    recordProvisioningPhaseResult,
    finalizeProvisioningRun,
    getLatestProvisioningState,
    getSuccessfulPhaseResults,
    driftSummaryFromReconcileSummary,
    createInMemoryProvisioningStateStore
};
