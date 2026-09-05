"use strict";

const { DEFAULT_LOCK_LEASE_MS } = require("./contracts");

class ProvisioningLockConflictError extends Error {
    /**
     * @param {string} databaseIdentity
     * @param {import('./types').ProvisioningLockDocument} lock
     */
    constructor(databaseIdentity, lock) {
        super(
            `Provisioning lock for ${databaseIdentity} is held by ${lock.ownerId} until ${lock.expiresAt.toISOString()}`
        );
        this.name = "ProvisioningLockConflictError";
        this.databaseIdentity = databaseIdentity;
        this.lock = lock;
    }
}

/**
 * @typedef {Object} ProvisioningLockStore
 * @property {(filter: Record<string, unknown>) => Promise<import('./types').ProvisioningLockDocument | null>} findOne
 * @property {(document: import('./types').ProvisioningLockDocument) => Promise<void>} insertOne
 * @property {(filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<import('./types').ProvisioningLockDocument | null>} findOneAndUpdate
 * @property {(filter: Record<string, unknown>) => Promise<{ deletedCount: number }>} deleteOne
 */

/**
 * @param {import("mongoose").Model} model
 * @returns {ProvisioningLockStore}
 */
function createProvisioningLockStore(model) {
    const collection = model.collection;
    return {
        findOne: async (filter) => collection.findOne(filter),
        insertOne: async (document) => {
            await collection.insertOne(document);
        },
        findOneAndUpdate: async (filter, update) => {
            const result = await collection.findOneAndUpdate(filter, update, {
                returnDocument: "after"
            });
            return result || null;
        },
        deleteOne: async (filter) => collection.deleteOne(filter)
    };
}

/**
 * @param {ProvisioningLockStore} store
 * @param {Object} input
 * @param {string} input.databaseIdentity
 * @param {string} input.ownerId
 * @param {string} input.runId
 * @param {number} [input.leaseMs]
 * @param {Date} [input.now]
 * @returns {Promise<import('./types').ProvisioningLockAcquireResult>}
 */
async function acquireProvisioningLock(store, input) {
    const leaseMs = input.leaseMs ?? DEFAULT_LOCK_LEASE_MS;
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + leaseMs);

    const renewed = await store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity,
            ownerId: input.ownerId,
            expiresAt: { $gt: now }
        },
        {
            $set: {
                runId: input.runId,
                acquiredAt: now,
                expiresAt,
                updatedAt: now
            }
        }
    );
    if (renewed) {
        return {
            acquired: true,
            lock: renewed,
            renewed: true
        };
    }

    const reclaimed = await store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity,
            expiresAt: { $lte: now }
        },
        {
            $set: {
                ownerId: input.ownerId,
                runId: input.runId,
                acquiredAt: now,
                expiresAt,
                updatedAt: now
            }
        }
    );
    if (reclaimed) {
        return {
            acquired: true,
            lock: reclaimed,
            reclaimed: true
        };
    }

    /** @type {import('./types').ProvisioningLockDocument} */
    const document = {
        databaseIdentity: input.databaseIdentity,
        ownerId: input.ownerId,
        runId: input.runId,
        acquiredAt: now,
        expiresAt,
        updatedAt: now
    };

    try {
        await store.insertOne(document);
        return {
            acquired: true,
            lock: document
        };
    } catch (error) {
        if (error && error.code === 11000) {
            const existing = await store.findOne({
                databaseIdentity: input.databaseIdentity
            });
            if (
                existing &&
                existing.ownerId === input.ownerId &&
                existing.expiresAt > now
            ) {
                const recovered = await store.findOneAndUpdate(
                    {
                        databaseIdentity: input.databaseIdentity,
                        ownerId: input.ownerId,
                        expiresAt: { $gt: now }
                    },
                    {
                        $set: {
                            runId: input.runId,
                            acquiredAt: now,
                            expiresAt,
                            updatedAt: now
                        }
                    }
                );
                if (recovered) {
                    return {
                        acquired: true,
                        lock: recovered,
                        renewed: true
                    };
                }
            }
            return {
                acquired: false,
                conflict: true,
                lock: existing || undefined,
                reason:
                    existing && existing.expiresAt > now
                        ? "held-by-other-owner"
                        : "duplicate-key-race"
            };
        }
        throw error;
    }
}

/**
 * @param {ProvisioningLockStore} store
 * @param {Object} input
 * @param {string} input.databaseIdentity
 * @param {string} input.ownerId
 * @returns {Promise<boolean>}
 */
async function releaseProvisioningLock(store, input) {
    const result = await store.deleteOne({
        databaseIdentity: input.databaseIdentity,
        ownerId: input.ownerId
    });
    return result.deletedCount === 1;
}

/**
 * @param {ProvisioningLockStore} store
 * @param {Object} input
 * @param {string} input.databaseIdentity
 * @param {string} input.ownerId
 * @param {number} [input.leaseMs]
 * @param {Date} [input.now]
 * @returns {Promise<import('./types').ProvisioningLockDocument | null>}
 */
async function renewProvisioningLockLease(store, input) {
    const leaseMs = input.leaseMs ?? DEFAULT_LOCK_LEASE_MS;
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + leaseMs);
    return store.findOneAndUpdate(
        {
            databaseIdentity: input.databaseIdentity,
            ownerId: input.ownerId,
            expiresAt: { $gt: now }
        },
        {
            $set: {
                expiresAt,
                updatedAt: now
            }
        }
    );
}

/**
 * @param {ProvisioningLockStore} store
 * @param {string} databaseIdentity
 * @returns {Promise<import('./types').ProvisioningLockDocument | null>}
 */
async function getProvisioningLock(store, databaseIdentity) {
    return store.findOne({ databaseIdentity });
}

/**
 * @returns {ProvisioningLockStore}
 */
function createInMemoryProvisioningLockStore() {
    /** @type {Map<string, import('./types').ProvisioningLockDocument>} */
    const locks = new Map();

    return {
        findOne: async (filter) => {
            if (filter.databaseIdentity) {
                const lock = locks.get(filter.databaseIdentity);
                if (!lock) {
                    return null;
                }
                if (filter.ownerId && lock.ownerId !== filter.ownerId) {
                    return null;
                }
                if (filter.expiresAt) {
                    if (filter.expiresAt.$gt && lock.expiresAt <= filter.expiresAt.$gt) {
                        return null;
                    }
                    if (filter.expiresAt.$lte && lock.expiresAt > filter.expiresAt.$lte) {
                        return null;
                    }
                }
                return { ...lock };
            }
            return null;
        },
        insertOne: async (document) => {
            if (locks.has(document.databaseIdentity)) {
                const error = new Error("duplicate key");
                error.code = 11000;
                throw error;
            }
            locks.set(document.databaseIdentity, { ...document });
        },
        findOneAndUpdate: async (filter, update) => {
            const lock = locks.get(filter.databaseIdentity);
            if (!lock) {
                return null;
            }
            if (filter.ownerId && lock.ownerId !== filter.ownerId) {
                return null;
            }
            if (filter.expiresAt) {
                if (filter.expiresAt.$gt && lock.expiresAt <= filter.expiresAt.$gt) {
                    return null;
                }
                if (filter.expiresAt.$lte && lock.expiresAt > filter.expiresAt.$lte) {
                    return null;
                }
            }
            const next = {
                ...lock,
                ...update.$set
            };
            locks.set(filter.databaseIdentity, next);
            return { ...next };
        },
        deleteOne: async (filter) => {
            const lock = locks.get(filter.databaseIdentity);
            if (!lock) {
                return { deletedCount: 0 };
            }
            if (filter.ownerId && lock.ownerId !== filter.ownerId) {
                return { deletedCount: 0 };
            }
            locks.delete(filter.databaseIdentity);
            return { deletedCount: 1 };
        }
    };
}

module.exports = {
    ProvisioningLockConflictError,
    createProvisioningLockStore,
    acquireProvisioningLock,
    releaseProvisioningLock,
    renewProvisioningLockLease,
    getProvisioningLock,
    createInMemoryProvisioningLockStore
};
