"use strict";

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function sortRecordKeysDeep(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => sortRecordKeysDeep(entry));
    }
    if (!value || typeof value !== "object") {
        return value;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
        return value;
    }

    return Object.fromEntries(
        Object.keys(value)
            .sort((left, right) => left.localeCompare(right))
            .map((key) => [key, sortRecordKeysDeep(value[key])])
    );
}

/**
 * @param {Record<string, number>} key
 * @returns {Record<string, number>}
 */
function sortIndexKey(key) {
    return Object.fromEntries(
        Object.entries(key).sort(([left], [right]) => left.localeCompare(right))
    );
}

/**
 * @param {Record<string, unknown>} [options]
 * @returns {Record<string, unknown>}
 */
function normalizeIndexOptions(options = {}) {
    /** @type {Record<string, unknown>} */
    const normalized = {};

    if (options.unique === true) {
        normalized.unique = true;
    }
    if (options.sparse === true) {
        normalized.sparse = true;
    }
    if (options.background === true) {
        normalized.background = true;
    }
    if (options.partialFilterExpression) {
        normalized.partialFilterExpression = sortRecordKeysDeep(
            options.partialFilterExpression
        );
    }
    if (options.collation) {
        normalized.collation = sortRecordKeysDeep(options.collation);
    }

    return normalized;
}

/**
 * @param {Record<string, number>} key
 * @returns {string}
 */
function buildDefaultIndexName(key) {
    return Object.entries(sortIndexKey(key))
        .map(([field, direction]) => `${field}_${direction}`)
        .join("_");
}

/**
 * @param {Record<string, number>} key
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
function resolveIndexName(key, options = {}) {
    if (typeof options.name === "string" && options.name.length > 0) {
        return options.name;
    }
    return buildDefaultIndexName(key);
}

/**
 * @param {string} collection
 * @param {Record<string, number>} key
 * @param {Record<string, unknown>} [options]
 * @returns {string}
 */
function buildBaselineIndexIdentity(collection, key, options = {}) {
    return JSON.stringify({
        collection,
        key: sortIndexKey(key),
        options: normalizeIndexOptions(options)
    });
}

module.exports = {
    sortRecordKeysDeep,
    sortIndexKey,
    normalizeIndexOptions,
    buildDefaultIndexName,
    resolveIndexName,
    buildBaselineIndexIdentity
};
