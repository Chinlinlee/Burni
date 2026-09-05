"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
    MANIFEST_VERSION,
    MANIFEST_KIND,
    CHECKSUM_ALGORITHM,
    createBaselineIndexContract,
    createManifestChecksum,
    INDEX_SOURCES
} = require("./contracts");
const { buildBaselineIndexIdentity } = require("./indexIdentity");
const { buildModelCatalog } = require("./modelCatalog");
const {
    collectSchemaIndexes,
    sortBaselineIndexes
} = require("./schemaIndexCollector");
const { collectServiceIndexes } = require("./serviceIndexes");
const {
    collectApprovedTemporalDerivedIndexes,
    temporalEntryToDerivedIndex,
    sortDerivedIndexes
} = require("./temporalIndexAdapter");
const { sortRecordKeysDeep } = require("./indexIdentity");

const DEFAULT_ARTIFACT_PATH = path.join(
    __dirname,
    "artifacts",
    "desired-index-manifest.json"
);

/**
 * @param {import('./types').BaselineIndexContract[]} indexes
 * @returns {import('./types').BaselineIndexContract[]}
 */
function mergeBaselineIndexes(indexes) {
    const byIdentity = new Map();
    for (const index of indexes) {
        if (byIdentity.has(index.identity)) {
            continue;
        }
        byIdentity.set(index.identity, index);
    }
    return sortBaselineIndexes([...byIdentity.values()]);
}

/**
 * @param {import('./types').DesiredManifest} manifest
 * @returns {Record<string, unknown>}
 */
function buildCanonicalManifestBody(manifest) {
    const { checksum, generatedAt, ...body } = manifest;
    void checksum;
    void generatedAt;
    return sortRecordKeysDeep(body);
}

/**
 * @param {Record<string, unknown>} manifestBody
 * @returns {string}
 */
function computeManifestChecksumValue(manifestBody) {
    const canonical = JSON.stringify(buildCanonicalManifestBody(manifestBody));
    return crypto.createHash(CHECKSUM_ALGORITHM).update(canonical).digest("hex");
}

/**
 * @param {Record<string, import("mongoose").Model>} modelMap
 * @param {Object} [options]
 * @param {import('./types').ModelCatalog} [options.catalog]
 * @param {string} [options.generatedAt]
 * @param {Object} [options.catalogOptions]
 * @param {Object} [options.temporalOptions]
 * @returns {import('./types').DesiredManifest}
 */
function generateDesiredManifest(modelMap, options = {}) {
    const catalog = options.catalog || buildModelCatalog(options.catalogOptions);
    const schemaIndexes = collectSchemaIndexes(modelMap, catalog);
    const serviceIndexes = collectServiceIndexes(catalog).map((serviceIndex) =>
        createBaselineIndexContract({
            collection: serviceIndex.collection,
            key: serviceIndex.key,
            options: serviceIndex.options,
            name: serviceIndex.name,
            source: INDEX_SOURCES.SERVICE,
            identity: buildBaselineIndexIdentity(
                serviceIndex.collection,
                serviceIndex.key,
                serviceIndex.options
            )
        })
    );
    const baselineIndexes = mergeBaselineIndexes([
        ...schemaIndexes,
        ...serviceIndexes
    ]);

    const temporal = collectApprovedTemporalDerivedIndexes(options.temporalOptions);
    const derivedIndexes = sortDerivedIndexes(
        temporal.entries.map((entry) => temporalEntryToDerivedIndex(entry))
    );

    /** @type {import('./types').DesiredManifest} */
    const manifest = {
        version: MANIFEST_VERSION,
        kind: MANIFEST_KIND,
        generatedAt: options.generatedAt || new Date().toISOString(),
        artifactIdentity: temporal.artifactIdentity,
        collections: catalog.entries,
        baselineIndexes,
        derivedIndexes,
        counts: {
            collections: catalog.entries.length,
            baselineIndexes: baselineIndexes.length,
            derivedIndexes: derivedIndexes.length
        },
        temporalDiagnostics: temporal.diagnostics
    };

    const checksumValue = computeManifestChecksumValue(manifest);
    manifest.checksum = createManifestChecksum(checksumValue);
    return manifest;
}

/**
 * @param {import('./types').DesiredManifest} manifest
 * @returns {string}
 */
function serializeDesiredManifest(manifest) {
    return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * @param {import('./types').DesiredManifest} manifest
 * @param {string} [artifactPath]
 * @returns {string}
 */
function writeDesiredManifestArtifact(manifest, artifactPath = DEFAULT_ARTIFACT_PATH) {
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, serializeDesiredManifest(manifest));
    return artifactPath;
}

module.exports = {
    DEFAULT_ARTIFACT_PATH,
    buildCanonicalManifestBody,
    computeManifestChecksumValue,
    generateDesiredManifest,
    serializeDesiredManifest,
    writeDesiredManifestArtifact
};
