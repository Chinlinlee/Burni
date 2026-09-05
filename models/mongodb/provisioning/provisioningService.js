"use strict";

const {
    COLLECTION_RECONCILE_STATUS,
    INDEX_RECONCILE_STATUS,
    INDEX_SOURCES,
    createReconcileResult
} = require("./contracts");
const { generateDesiredManifest } = require("./desiredManifest");
const {
    provisionCollections,
    inspectCollections,
    summarizeCollectionResults
} = require("./collectionProvisioner");
const { reconcileIndexes, summarizeIndexResults } = require("./indexReconciler");
const {
    createMongoDdlClient,
    createMongoDdlClientFromConnection
} = require("./mongoDdlClient");
const { collectApprovedTemporalDerivedIndexes } = require("./temporalIndexAdapter");
const { collectApprovedSearchParameterDerivedIndexes } = require("./searchParameterIndexAdapter");

/**
 * @param {import('./types').DesiredManifest} manifest
 * @returns {string[]}
 */
function collectDerivedIntegrationErrors(manifest) {
    /** @type {string[]} */
    const errors = [];

    for (const entry of manifest.derivedIndexes) {
        if (
            entry.source !== INDEX_SOURCES.TEMPORAL &&
            entry.source !== INDEX_SOURCES.SEARCH_PARAMETER
        ) {
            errors.push(`Derived index ${entry.name} has an unsupported source: ${entry.source}`);
            continue;
        }
        if (entry.source === INDEX_SOURCES.TEMPORAL) {
            if (!entry.name.startsWith("fhir_temporal_")) {
                errors.push(`Derived index ${entry.name} does not use deterministic temporal naming`);
            }
            if (!entry.temporal?.extractionPath || !entry.temporal?.bsonType) {
                errors.push(`Derived index ${entry.name} is missing temporal metadata`);
            }
            continue;
        }
        if (!entry.name.startsWith("fhir_sp_")) {
            errors.push(
                `Derived index ${entry.name} does not use deterministic search-parameter naming`
            );
        }
        if (
            !entry.searchParameter?.extractionPath ||
            !entry.searchParameter?.searchType ||
            !entry.searchParameter?.keyPattern
        ) {
            errors.push(`Derived index ${entry.name} is missing search-parameter metadata`);
        }
    }

    return errors;
}

/**
 * @param {import('./types').DesiredManifest} manifest
 * @param {Object} [options]
 * @returns {import('./types').DesiredManifest}
 */
function assertApprovedDerivedManifest(manifest, options = {}) {
    const temporal = collectApprovedTemporalDerivedIndexes(options.temporalOptions);
    const searchParameter = collectApprovedSearchParameterDerivedIndexes(
        options.searchParameterOptions
    );
    const approvedNames = new Set([
        ...temporal.entries.map((entry) => entry.name),
        ...searchParameter.entries.map((entry) => entry.name)
    ]);
    const manifestNames = manifest.derivedIndexes.map((entry) => entry.name);

    if (manifestNames.length !== approvedNames.size) {
        throw new Error(
            `Desired manifest derived index count ${manifestNames.length} does not match approved count ${approvedNames.size}`
        );
    }

    for (const name of manifestNames) {
        if (!approvedNames.has(name)) {
            throw new Error(`Desired manifest includes unapproved derived index: ${name}`);
        }
    }

    if (
        manifest.derivedIndexPolicy?.searchParameterPolicyVersion !==
        searchParameter.policyVersion
    ) {
        throw new Error("Desired manifest search-parameter policy version drifted");
    }

    if (
        manifest.derivedIndexPolicy?.searchParameterPolicySource !==
        "search-parameter-derived-indexes"
    ) {
        throw new Error("Desired manifest search-parameter policy source drifted");
    }
    if (
        JSON.stringify(manifest.artifactIdentity) !==
        JSON.stringify(searchParameter.artifactIdentity)
    ) {
        throw new Error("Desired manifest SearchParameter artifact identity drifted");
    }

    const integrationErrors = collectDerivedIntegrationErrors(manifest);
    if (integrationErrors.length > 0) {
        throw new Error(integrationErrors.join("; "));
    }

    return manifest;
}

/**
 * @deprecated Use assertApprovedDerivedManifest
 * @param {import('./types').DesiredManifest} manifest
 * @param {Object} [options]
 * @returns {import('./types').DesiredManifest}
 */
function assertApprovedTemporalManifest(manifest, options = {}) {
    return assertApprovedDerivedManifest(manifest, options);
}

/**
 * @deprecated Use collectDerivedIntegrationErrors
 * @param {import('./types').DesiredManifest} manifest
 * @returns {string[]}
 */
function collectTemporalIntegrationErrors(manifest) {
    return collectDerivedIntegrationErrors(manifest);
}

/**
 * @param {import('./types').CollectionReconcileEntry[]} collections
 * @param {import('./types').IndexReconcileEntry[]} indexes
 * @returns {boolean}
 */
function isProvisioningVerified(collections, indexes) {
    const collectionFailures = collections.some((entry) =>
        [COLLECTION_RECONCILE_STATUS.FAILED, COLLECTION_RECONCILE_STATUS.MISSING].includes(
            entry.status
        )
    );
    const indexProblems = indexes.some((entry) =>
        [
            INDEX_RECONCILE_STATUS.MISSING,
            INDEX_RECONCILE_STATUS.MISMATCH
        ].includes(entry.status)
    );
    return !collectionFailures && !indexProblems;
}

/**
 * @param {Object} input
 * @param {import('./types').CollectionReconcileEntry[]} input.collections
 * @param {import('./types').IndexReconcileEntry[]} input.indexes
 * @param {import('./types').DesiredManifest} input.manifest
 * @returns {import('./types').ReconcileResult}
 */
function buildReconcileResult(input) {
    const collectionSummary = summarizeCollectionResults(input.collections);
    const indexSummary = summarizeIndexResults(input.indexes);
    /** @type {string[]} */
    const errors = [];

    for (const entry of input.collections) {
        if (entry.status === COLLECTION_RECONCILE_STATUS.FAILED) {
            errors.push(`${entry.collection}: ${entry.error || "collection provisioning failed"}`);
        }
        if (entry.status === COLLECTION_RECONCILE_STATUS.MISSING) {
            errors.push(`${entry.collection}: ${entry.error || "collection missing"}`);
        }
    }
    for (const entry of input.indexes) {
        if (entry.status === INDEX_RECONCILE_STATUS.MISMATCH) {
            errors.push(
                `${entry.collection}.${entry.name}: ${entry.drift?.message || "index mismatch"}`
            );
        }
        if (entry.status === INDEX_RECONCILE_STATUS.MISSING) {
            errors.push(
                `${entry.collection}.${entry.name}: ${entry.drift?.message || "index missing"}`
            );
        }
    }

    return createReconcileResult({
        manifestChecksum: input.manifest.checksum.value,
        manifestVersion: input.manifest.version,
        verified: isProvisioningVerified(input.collections, input.indexes),
        collections: input.collections,
        indexes: input.indexes,
        summary: {
            ...collectionSummary,
            ...indexSummary
        },
        errors
    });
}

/**
 * @param {Object} options
 * @param {import("mongodb").Db} [options.db]
 * @param {import("mongoose").Connection} [options.connection]
 * @param {import('./mongoDdlClient').MongoDdlClient} [options.ddlClient]
 * @param {Record<string, import("mongoose").Model>} [options.modelMap]
 * @param {import('./types').DesiredManifest} [options.manifest]
 * @param {boolean} [options.skipTemporalValidation]
 * @returns {Promise<import('./types').ReconcileResult>}
 */
async function verifyMongoProvisioning(options = {}) {
    const manifest = resolveManifest(options);
    const ddlClient = resolveDdlClient(options);
    const collections = await inspectCollections(manifest.collections, ddlClient);
    const baselineIndexes = await reconcileIndexes(manifest.baselineIndexes, ddlClient, {
        mode: "verify"
    });
    const temporalIndexes = await reconcileIndexes(manifest.derivedIndexes, ddlClient, {
        mode: "verify"
    });

    return buildReconcileResult({
        manifest,
        collections,
        indexes: [...baselineIndexes, ...temporalIndexes]
    });
}

/**
 * @param {Object} options
 * @param {import("mongodb").Db} [options.db]
 * @param {import("mongoose").Connection} [options.connection]
 * @param {import('./mongoDdlClient').MongoDdlClient} [options.ddlClient]
 * @param {Record<string, import("mongoose").Model>} [options.modelMap]
 * @param {import('./types').DesiredManifest} [options.manifest]
 * @param {boolean} [options.skipTemporalValidation]
 * @returns {Promise<import('./types').ReconcileResult>}
 */
async function provisionMongoDatabase(options = {}) {
    const manifest = resolveManifest(options);
    const ddlClient = resolveDdlClient(options);

    const collections = await provisionCollections(manifest.collections, ddlClient);
    const baselineIndexes = await reconcileIndexes(manifest.baselineIndexes, ddlClient, {
        mode: "provision"
    });
    const temporalIndexes = await reconcileIndexes(manifest.derivedIndexes, ddlClient, {
        mode: "provision"
    });

    return buildReconcileResult({
        manifest,
        collections,
        indexes: [...baselineIndexes, ...temporalIndexes]
    });
}

/**
 * @param {Object} options
 * @returns {import('./types').DesiredManifest}
 */
function resolveManifest(options) {
    if (options.manifest) {
        if (!options.skipTemporalValidation) {
            assertApprovedDerivedManifest(options.manifest, options);
        }
        return options.manifest;
    }
    if (!options.modelMap) {
        throw new Error("Mongo provisioning requires modelMap or manifest");
    }
    const manifest = generateDesiredManifest(options.modelMap, options);
    if (!options.skipTemporalValidation) {
        assertApprovedDerivedManifest(manifest, options);
    }
    return manifest;
}

/**
 * @param {Object} options
 * @returns {import('./mongoDdlClient').MongoDdlClient}
 */
function resolveDdlClient(options) {
    if (options.ddlClient) {
        return options.ddlClient;
    }
    if (options.db) {
        return createMongoDdlClient(options.db);
    }
    if (options.connection) {
        return createMongoDdlClientFromConnection(options.connection);
    }
    throw new Error("Mongo provisioning requires db, connection, or ddlClient");
}

module.exports = {
    assertApprovedDerivedManifest,
    assertApprovedTemporalManifest,
    buildReconcileResult,
    collectDerivedIntegrationErrors,
    collectTemporalIntegrationErrors,
    isProvisioningVerified,
    provisionMongoDatabase,
    verifyMongoProvisioning,
    resolveManifest,
    resolveDdlClient
};
