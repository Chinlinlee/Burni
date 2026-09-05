"use strict";

const {
    INDEX_DRIFT_TYPES,
    INDEX_RECONCILE_STATUS
} = require("./contracts");
const {
    classifyCollectionIndexes,
    groupDesiredIndexesByCollection,
    isResourceIdIndexKey
} = require("./indexComparison");

/**
 * @param {import('./types').BaselineIndexContract | import('./types').DerivedIndexContract} desired
 * @returns {Record<string, unknown>}
 */
function buildCreateIndexOptions(desired) {
    const options = {
        ...desired.options,
        name: desired.name
    };

    // Provisioning must never promote the resource id index to unique implicitly.
    if (isResourceIdIndexKey(desired.key)) {
        delete options.unique;
    }

    return options;
}

/**
 * @param {Array<import('./types').BaselineIndexContract | import('./types').DerivedIndexContract>} desiredIndexes
 * @param {import('./mongoDdlClient').MongoDdlClient} ddlClient
 * @param {Object} [options]
 * @param {"provision" | "verify"} [options.mode]
 * @returns {Promise<import('./types').IndexReconcileEntry[]>}
 */
async function reconcileIndexes(desiredIndexes, ddlClient, options = {}) {
    const mode = options.mode || "verify";
    /** @type {import('./types').IndexReconcileEntry[]} */
    const entries = [];
    const grouped = groupDesiredIndexesByCollection(desiredIndexes);

    for (const [collection, indexesForCollection] of grouped.entries()) {
        let actualIndexes = [];
        try {
            actualIndexes = await ddlClient.listIndexes(collection);
        } catch (error) {
            for (const desired of indexesForCollection) {
                entries.push({
                    collection,
                    name: desired.name,
                    identity: desired.identity,
                    status: INDEX_RECONCILE_STATUS.MISSING,
                    drift: {
                        type: INDEX_DRIFT_TYPES.MISSING,
                        message:
                            error instanceof Error
                                ? `Unable to list indexes for ${collection}: ${error.message}`
                                : `Unable to list indexes for ${collection}`
                    }
                });
            }
            continue;
        }

        const classification = classifyCollectionIndexes(indexesForCollection, actualIndexes);

        for (const item of classification.desired) {
            if (item.status === INDEX_RECONCILE_STATUS.MISSING && mode === "provision") {
                try {
                    await ddlClient.createIndex(
                        collection,
                        item.desired.key,
                        buildCreateIndexOptions(item.desired)
                    );
                    entries.push({
                        collection,
                        name: item.desired.name,
                        identity: item.desired.identity,
                        status: INDEX_RECONCILE_STATUS.CREATED,
                        drift: {
                            type: INDEX_DRIFT_TYPES.MISSING,
                            expected: {
                                identity: item.desired.identity,
                                name: item.desired.name
                            },
                            message: "Missing index created by provisioning"
                        }
                    });
                } catch (error) {
                    entries.push({
                        collection,
                        name: item.desired.name,
                        identity: item.desired.identity,
                        status: INDEX_RECONCILE_STATUS.MISMATCH,
                        drift: {
                            type: INDEX_DRIFT_TYPES.MISMATCH,
                            message:
                                error instanceof Error
                                    ? error.message
                                    : "Index creation failed during provisioning"
                        }
                    });
                }
                continue;
            }

            entries.push({
                collection,
                name: item.desired.name,
                identity: item.desired.identity,
                status: item.status,
                drift: item.drift
            });
        }

        for (const extra of classification.extra) {
            entries.push({
                collection,
                name: String(extra.name),
                identity: String(extra.name),
                status: INDEX_RECONCILE_STATUS.EXTRA,
                drift: {
                    type: INDEX_DRIFT_TYPES.EXTRA,
                    actual: {
                        name: extra.name,
                        key: extra.key,
                        unique: extra.unique === true
                    },
                    message: "Actual index is not declared in desired manifest"
                }
            });
        }
    }

    return entries.sort((left, right) => {
        const byCollection = left.collection.localeCompare(right.collection);
        if (byCollection !== 0) {
            return byCollection;
        }
        return left.name.localeCompare(right.name);
    });
}

/**
 * @param {import('./types').IndexReconcileEntry[]} entries
 * @returns {import('./types').ReconcileSummary}
 */
function summarizeIndexResults(entries) {
    return {
        indexesCreated: entries.filter(
            (entry) => entry.status === INDEX_RECONCILE_STATUS.CREATED
        ).length,
        indexesCompatible: entries.filter(
            (entry) => entry.status === INDEX_RECONCILE_STATUS.COMPATIBLE
        ).length,
        indexesMissing: entries.filter(
            (entry) => entry.status === INDEX_RECONCILE_STATUS.MISSING
        ).length,
        indexesExtra: entries.filter((entry) => entry.status === INDEX_RECONCILE_STATUS.EXTRA)
            .length,
        indexesMismatch: entries.filter(
            (entry) => entry.status === INDEX_RECONCILE_STATUS.MISMATCH
        ).length
    };
}

module.exports = {
    buildCreateIndexOptions,
    reconcileIndexes,
    summarizeIndexResults
};
