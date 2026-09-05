"use strict";

const { COLLECTION_RECONCILE_STATUS } = require("./contracts");

/**
 * @param {import('./types').CollectionContract[]} collections
 * @param {import('./mongoDdlClient').MongoDdlClient} ddlClient
 * @returns {Promise<import('./types').CollectionReconcileEntry[]>}
 */
async function provisionCollections(collections, ddlClient) {
    const existing = new Set(await ddlClient.listCollectionNames());
    /** @type {import('./types').CollectionReconcileEntry[]} */
    const results = [];

    for (const entry of collections) {
        if (existing.has(entry.collection)) {
            results.push({
                collection: entry.collection,
                status: COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING
            });
            continue;
        }

        try {
            await ddlClient.createCollection(entry.collection);
            existing.add(entry.collection);
            results.push({
                collection: entry.collection,
                status: COLLECTION_RECONCILE_STATUS.CREATED
            });
        } catch (error) {
            results.push({
                collection: entry.collection,
                status: COLLECTION_RECONCILE_STATUS.FAILED,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return results.sort((left, right) => left.collection.localeCompare(right.collection));
}

/**
 * @param {import('./types').CollectionContract[]} collections
 * @param {import('./mongoDdlClient').MongoDdlClient} ddlClient
 * @returns {Promise<import('./types').CollectionReconcileEntry[]>}
 */
async function inspectCollections(collections, ddlClient) {
    const existing = new Set(await ddlClient.listCollectionNames());
    /** @type {import('./types').CollectionReconcileEntry[]} */
    const results = [];

    for (const entry of collections) {
        if (existing.has(entry.collection)) {
            results.push({
                collection: entry.collection,
                status: COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING
            });
            continue;
        }

        results.push({
            collection: entry.collection,
            status: COLLECTION_RECONCILE_STATUS.MISSING,
            error: `Collection ${entry.collection} is missing`
        });
    }

    return results.sort((left, right) => left.collection.localeCompare(right.collection));
}

/**
 * @param {import('./types').CollectionReconcileEntry[]} entries
 * @returns {import('./types').ReconcileSummary}
 */
function summarizeCollectionResults(entries) {
    return {
        collectionsCreated: entries.filter(
            (entry) => entry.status === COLLECTION_RECONCILE_STATUS.CREATED
        ).length,
        collectionsExisting: entries.filter(
            (entry) => entry.status === COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING
        ).length,
        collectionsMissing: entries.filter(
            (entry) => entry.status === COLLECTION_RECONCILE_STATUS.MISSING
        ).length,
        collectionsFailed: entries.filter(
            (entry) => entry.status === COLLECTION_RECONCILE_STATUS.FAILED
        ).length
    };
}

module.exports = {
    provisionCollections,
    inspectCollections,
    summarizeCollectionResults
};
