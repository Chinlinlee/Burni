"use strict";

const crypto = require("crypto");
const {
    NON_TEMPORAL_MANIFEST_KIND,
    NON_TEMPORAL_MANIFEST_VERSION,
    NON_TEMPORAL_POLICY_VERSION,
    INDEX_NAME_PREFIX
} = require("./constants");

/**
 * @param {import('./types').ApprovedIndexSpec} spec
 * @returns {Record<string, unknown>}
 */
function buildCanonicalIdentityBody(spec) {
    return {
        resourceType: spec.resourceType,
        extractionPath: spec.extractionPath,
        datatype: spec.datatype,
        searchType: spec.searchType,
        keyPattern: spec.keyPattern,
        key: spec.key,
        options: spec.options,
        policyVersion: spec.policyVersion
    };
}

/**
 * @param {import('./types').ApprovedIndexSpec} spec
 * @returns {string}
 */
function getIndexIdentity(spec) {
    return JSON.stringify(buildCanonicalIdentityBody(spec));
}

/**
 * @param {import('./types').ApprovedIndexSpec} spec
 * @returns {string}
 */
function buildIndexName(spec) {
    const digest = crypto
        .createHash("sha256")
        .update(getIndexIdentity(spec))
        .digest("hex")
        .slice(0, 20);
    return `${INDEX_NAME_PREFIX}_${spec.searchType}_${digest}`;
}

/**
 * @param {import('./types').ApprovedIndexSpec} spec
 * @returns {import('./types').SearchParameterIndexEntry}
 */
function createSearchParameterIndexEntry(spec) {
    const identity = getIndexIdentity(spec);
    return {
        resourceType: spec.resourceType,
        extractionPath: spec.extractionPath,
        datatype: spec.datatype,
        searchType: spec.searchType,
        keyPattern: spec.keyPattern,
        fields: spec.fields,
        key: spec.key,
        options: spec.options,
        policyVersion: spec.policyVersion,
        compatibility: spec.compatibility,
        sources: {
            lookupKeys: [...spec.provenance.lookupKeys].sort(),
            canonicalKeys: [...spec.provenance.canonicalKeys].sort(),
            codes: [...spec.provenance.codes].sort()
        },
        identity,
        name: buildIndexName(spec)
    };
}

/**
 * @param {import('./types').SearchParameterIndexEntry} existing
 * @param {import('./types').SearchParameterIndexEntry} next
 * @returns {import('./types').SearchParameterIndexEntry}
 */
function mergeIndexSources(existing, next) {
    return {
        ...existing,
        sources: {
            lookupKeys: [...new Set([...existing.sources.lookupKeys, ...next.sources.lookupKeys])].sort(),
            canonicalKeys: [
                ...new Set([...existing.sources.canonicalKeys, ...next.sources.canonicalKeys])
            ].sort(),
            codes: [...new Set([...existing.sources.codes, ...next.sources.codes])].sort()
        }
    };
}

/**
 * @param {import('./types').SearchParameterIndexEntry[]} indexes
 * @returns {import('./types').SearchParameterIndexEntry[]}
 */
function sortManifestIndexes(indexes) {
    return [...indexes].sort((left, right) => left.identity.localeCompare(right.identity));
}

/**
 * @param {import('./types').ApprovedIndexSpec[]} specs
 * @returns {import('./types').SearchParameterDerivedIndexManifest}
 */
function createSearchParameterIndexManifest(specs = []) {
    const byIdentity = new Map();
    for (const spec of specs) {
        const entry = createSearchParameterIndexEntry(spec);
        const existing = byIdentity.get(entry.identity);
        byIdentity.set(entry.identity, existing ? mergeIndexSources(existing, entry) : entry);
    }

    const sortedIndexes = sortManifestIndexes([...byIdentity.values()]);
    return {
        version: NON_TEMPORAL_MANIFEST_VERSION,
        kind: NON_TEMPORAL_MANIFEST_KIND,
        policyVersion: NON_TEMPORAL_POLICY_VERSION,
        indexes: sortedIndexes,
        indexCount: sortedIndexes.length
    };
}

module.exports = {
    buildCanonicalIdentityBody,
    getIndexIdentity,
    buildIndexName,
    createSearchParameterIndexEntry,
    createSearchParameterIndexManifest,
    sortManifestIndexes,
    mergeIndexSources
};
