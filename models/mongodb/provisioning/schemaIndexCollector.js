"use strict";

const {
    createBaselineIndexContract,
    INDEX_SOURCES
} = require("./contracts");
const {
    buildBaselineIndexIdentity,
    normalizeIndexOptions,
    resolveIndexName,
    sortIndexKey
} = require("./indexIdentity");

/**
 * @param {import("mongoose").Model} model
 * @param {import('./types').CollectionContract} catalogEntry
 * @returns {import('./types').BaselineIndexContract[]}
 */
function collectSchemaIndexesFromModel(model, catalogEntry) {
    const rawIndexes = model.schema.indexes();
    /** @type {import('./types').BaselineIndexContract[]} */
    const indexes = [];

    for (const [key, options] of rawIndexes) {
        const normalizedKey = sortIndexKey(key);
        const normalizedOptions = normalizeIndexOptions(options);
        const name = resolveIndexName(key, options);
        indexes.push(
            createBaselineIndexContract({
                collection: catalogEntry.collection,
                key: normalizedKey,
                options: normalizedOptions,
                name,
                source: INDEX_SOURCES.SCHEMA,
                identity: buildBaselineIndexIdentity(
                    catalogEntry.collection,
                    key,
                    options
                )
            })
        );
    }

    return indexes;
}

/**
 * @param {Record<string, import("mongoose").Model>} modelMap
 * @param {import('./types').ModelCatalog} catalog
 * @returns {import('./types').BaselineIndexContract[]}
 */
function collectSchemaIndexes(modelMap, catalog) {
    /** @type {import('./types').BaselineIndexContract[]} */
    const indexes = [];

    for (const entry of catalog.entries) {
        const model = modelMap[entry.modelName];
        if (!model) {
            throw new Error(`Model not registered for catalog entry: ${entry.modelName}`);
        }
        indexes.push(...collectSchemaIndexesFromModel(model, entry));
    }

    return sortBaselineIndexes(indexes);
}

/**
 * @param {import('./types').BaselineIndexContract[]} indexes
 * @returns {import('./types').BaselineIndexContract[]}
 */
function sortBaselineIndexes(indexes) {
    return [...indexes].sort((left, right) => {
        const byCollection = left.collection.localeCompare(right.collection);
        if (byCollection !== 0) {
            return byCollection;
        }
        return left.identity.localeCompare(right.identity);
    });
}

module.exports = {
    collectSchemaIndexesFromModel,
    collectSchemaIndexes,
    sortBaselineIndexes
};
