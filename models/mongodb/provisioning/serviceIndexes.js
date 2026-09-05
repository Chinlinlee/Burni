"use strict";

const { MODEL_KINDS } = require("./contracts");

const HISTORY_VERSION_LOOKUP_NAME = "burni_service_history_id_version";

/**
 * @param {string} collection
 * @returns {{ collection: string, key: Record<string, number>, options: Record<string, boolean>, name: string }}
 */
function buildHistoryVersionLookupIndex(collection) {
    return {
        collection,
        key: {
            id: 1,
            "meta.versionId": -1
        },
        options: {
            background: true
        },
        name: HISTORY_VERSION_LOOKUP_NAME
    };
}

/**
 * @param {{ entries: Array<{ collection: string, modelKind: string }> }} catalog
 * @returns {Array<{ collection: string, key: Record<string, number>, options: Record<string, boolean>, name: string }>}
 */
function collectServiceIndexes(catalog) {
    /** @type {Array<{ collection: string, key: Record<string, number>, options: Record<string, boolean>, name: string }>} */
    const indexes = [];

    for (const entry of catalog.entries) {
        if (entry.modelKind !== MODEL_KINDS.HISTORY) {
            continue;
        }
        indexes.push(buildHistoryVersionLookupIndex(entry.collection));
    }

    return indexes.sort((left, right) => {
        const byCollection = left.collection.localeCompare(right.collection);
        if (byCollection !== 0) {
            return byCollection;
        }
        return left.name.localeCompare(right.name);
    });
}

module.exports = {
    HISTORY_VERSION_LOOKUP_NAME,
    buildHistoryVersionLookupIndex,
    collectServiceIndexes
};
