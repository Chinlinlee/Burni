"use strict";

const { MODEL_KINDS } = require("./contracts");
const { buildModelCatalog } = require("./modelCatalog");
const { isResourceIdIndexKey } = require("./indexComparison");
const { resolveIndexName } = require("./indexIdentity");
const {
    createIdentityAuditClient,
    createIdentityAuditClientFromConnection
} = require("./identityAuditClient");

const IDENTITY_AUDIT_PIPELINE = Object.freeze([
    {
        $match: {
            id: {
                $exists: true,
                $type: "string",
                $ne: ""
            }
        }
    },
    {
        $group: {
            _id: "$id",
            count: { $sum: 1 },
            documents: {
                $push: {
                    objectId: { $toString: "$_id" },
                    versionId: "$meta.versionId",
                    resourceType: "$resourceType"
                }
            }
        }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { _id: 1 } }
]);

const IDENTITY_MIGRATION_STATUS = Object.freeze({
    SUCCEEDED: "succeeded",
    BLOCKED: "blocked",
    FAILED: "failed"
});

class IdentityMigrationBlockedError extends Error {
    /**
     * @param {import('./types').IdentityDuplicateAuditReport} auditReport
     */
    constructor(auditReport) {
        super("Unique id index migration is blocked until duplicate audit is clean");
        this.name = "IdentityMigrationBlockedError";
        this.code = "IDENTITY_MIGRATION_BLOCKED";
        this.auditReport = auditReport;
    }
}

/**
 * @param {import('./types').ModelCatalog} catalog
 * @returns {import('./types').CollectionContract[]}
 */
function collectIdentityAuditTargets(catalog) {
    return catalog.entries
        .filter(
            (entry) =>
                entry.modelKind === MODEL_KINDS.RESOURCE ||
                entry.modelKind === MODEL_KINDS.HISTORY
        )
        .sort((left, right) => left.collection.localeCompare(right.collection));
}

/**
 * @param {Record<string, unknown>} row
 * @param {import('./types').CollectionContract} target
 * @returns {import('./types').IdentityDuplicateGroup}
 */
function mapAggregationRowToDuplicateGroup(row, target) {
    const documents = Array.isArray(row.documents) ? row.documents : [];
    return {
        collection: target.collection,
        resourceType: target.resourceType || target.collection,
        modelKind: target.modelKind,
        id: String(row._id),
        count: Number(row.count) || documents.length,
        documents: documents.map((document) => ({
            objectId: String(document.objectId),
            versionId:
                document.versionId === undefined || document.versionId === null
                    ? undefined
                    : String(document.versionId),
            resourceType:
                typeof document.resourceType === "string"
                    ? document.resourceType
                    : target.resourceType
        }))
    };
}

/**
 * @param {import('./types').IdentityDuplicateGroup[]} duplicates
 * @returns {import('./types').IdentityDuplicateAuditSummary}
 */
function summarizeDuplicateGroups(duplicates) {
    /** @type {Record<string, { duplicateIds: number, duplicateDocuments: number }>} */
    const byCollection = {};
    let duplicateDocumentCount = 0;

    for (const group of duplicates) {
        const extraDocuments = Math.max(group.count - 1, 0);
        duplicateDocumentCount += extraDocuments;
        const bucket = byCollection[group.collection] || {
            duplicateIds: 0,
            duplicateDocuments: 0
        };
        bucket.duplicateIds += 1;
        bucket.duplicateDocuments += extraDocuments;
        byCollection[group.collection] = bucket;
    }

    const collectionsWithDuplicates = Object.keys(byCollection).sort((left, right) =>
        left.localeCompare(right)
    );

    return {
        duplicateIdCount: duplicates.length,
        duplicateDocumentCount,
        collectionsWithDuplicates,
        byCollection
    };
}

/**
 * @param {import('./types').IdentityDuplicateGroup[]} duplicates
 * @param {Object} scan
 * @returns {import('./types').IdentityDuplicateAuditReport}
 */
function buildIdentityDuplicateAuditReport(duplicates, scan) {
    const summary = summarizeDuplicateGroups(duplicates);
    const hasDuplicates = duplicates.length > 0;

    return {
        clean: !hasDuplicates,
        hasDuplicates,
        scannedCollections: scan.scannedCollections,
        skippedCollections: scan.skippedCollections,
        duplicates,
        summary
    };
}

/**
 * @param {import('./types').IdentityDuplicateAuditReport} auditReport
 * @returns {import('./types').IdentityCleanAuditGateResult}
 */
function evaluateCleanAuditGate(auditReport) {
    if (auditReport.hasDuplicates) {
        return {
            clean: false,
            allowed: false,
            reason: "duplicate-resource-ids",
            duplicateIdCount: auditReport.summary.duplicateIdCount,
            duplicateDocumentCount: auditReport.summary.duplicateDocumentCount
        };
    }

    return {
        clean: true,
        allowed: true
    };
}

/**
 * @param {import('./types').CollectionContract[]} targets
 * @param {import('./identityAuditClient').IdentityAuditClient} auditClient
 * @returns {Promise<{ duplicates: import('./types').IdentityDuplicateGroup[], scannedCollections: number, skippedCollections: string[] }>}
 */
async function scanDuplicateResourceIds(targets, auditClient) {
    /** @type {import('./types').IdentityDuplicateGroup[]} */
    const duplicates = [];
    /** @type {string[]} */
    const skippedCollections = [];
    let scannedCollections = 0;

    for (const target of targets) {
        const exists = await auditClient.collectionExists(target.collection);
        if (!exists) {
            skippedCollections.push(target.collection);
            continue;
        }

        scannedCollections += 1;
        const rows = await auditClient.aggregate(target.collection, [...IDENTITY_AUDIT_PIPELINE]);
        for (const row of rows) {
            duplicates.push(mapAggregationRowToDuplicateGroup(row, target));
        }
    }

    duplicates.sort((left, right) => {
        const byCollection = left.collection.localeCompare(right.collection);
        if (byCollection !== 0) {
            return byCollection;
        }
        const byResourceType = left.resourceType.localeCompare(right.resourceType);
        if (byResourceType !== 0) {
            return byResourceType;
        }
        return left.id.localeCompare(right.id);
    });

    return {
        duplicates,
        scannedCollections,
        skippedCollections
    };
}

/**
 * @param {Object} options
 * @param {import("mongoose").Connection} [options.connection]
 * @param {import('./identityAuditClient').IdentityAuditClient} [options.auditClient]
 * @param {import('./types').ModelCatalog} [options.catalog]
 * @param {Object} [options.catalogOptions]
 * @returns {Promise<import('./types').IdentityDuplicateAuditReport>}
 */
async function auditDuplicateResourceIds(options = {}) {
    const catalog = options.catalog || buildModelCatalog(options.catalogOptions);
    const auditClient = resolveIdentityAuditClient(options);
    const targets = collectIdentityAuditTargets(catalog);
    const scan = await scanDuplicateResourceIds(targets, auditClient);
    return buildIdentityDuplicateAuditReport(scan.duplicates, scan);
}

/**
 * @param {Object} options
 * @returns {import('./identityAuditClient').IdentityAuditClient}
 */
function resolveIdentityAuditClient(options) {
    if (options.auditClient) {
        return options.auditClient;
    }
    if (options.connection) {
        return createIdentityAuditClientFromConnection(options.connection);
    }
    throw new Error("Identity audit requires connection or auditClient");
}

/**
 * @param {Object} options
 * @param {import('./types').IdentityDuplicateAuditReport} [options.auditReport]
 * @param {import('./mongoDdlClient').MongoDdlClient} options.ddlClient
 * @param {import('./types').ModelCatalog} [options.catalog]
 * @param {Object} [options.catalogOptions]
 * @param {import("mongoose").Connection} [options.connection]
 * @param {import('./identityAuditClient').IdentityAuditClient} [options.auditClient]
 * @returns {Promise<import('./types').IdentityUniqueMigrationResult>}
 */
async function runExplicitUniqueIdIndexMigration(options) {
    const auditReport =
        options.auditReport ||
        (await auditDuplicateResourceIds({
            connection: options.connection,
            auditClient: options.auditClient,
            catalog: options.catalog,
            catalogOptions: options.catalogOptions
        }));
    const gate = evaluateCleanAuditGate(auditReport);

    if (!gate.allowed) {
        return {
            status: IDENTITY_MIGRATION_STATUS.BLOCKED,
            gate,
            auditReport,
            indexesCreated: [],
            indexesSkipped: [],
            errors: ["Duplicate resource ids must be resolved before unique migration"]
        };
    }

    const catalog = options.catalog || buildModelCatalog(options.catalogOptions);
    const targets = collectIdentityAuditTargets(catalog);
    /** @type {import('./types').IdentityUniqueMigrationIndexResult[]} */
    const indexesCreated = [];
    /** @type {import('./types').IdentityUniqueMigrationIndexResult[]} */
    const indexesSkipped = [];
    /** @type {string[]} */
    const errors = [];

    for (const target of targets) {
        const collection = target.collection;
        try {
            const actualIndexes = await options.ddlClient.listIndexes(collection);
            const existingIdIndex = actualIndexes.find((entry) =>
                isResourceIdIndexKey(entry.key || {})
            );

            if (existingIdIndex?.unique === true) {
                indexesSkipped.push({
                    collection,
                    resourceType: target.resourceType || collection,
                    modelKind: target.modelKind,
                    name: String(existingIdIndex.name),
                    status: "already-unique"
                });
                continue;
            }

            const indexName = existingIdIndex
                ? String(existingIdIndex.name)
                : resolveIndexName({ id: 1 }, {});

            if (existingIdIndex && existingIdIndex.name) {
                await options.ddlClient.dropIndex(collection, String(existingIdIndex.name));
            }

            await options.ddlClient.createIndex(
                collection,
                { id: 1 },
                {
                    unique: true,
                    name: indexName,
                    background: true
                }
            );

            indexesCreated.push({
                collection,
                resourceType: target.resourceType || collection,
                modelKind: target.modelKind,
                name: indexName,
                status: "created"
            });
        } catch (error) {
            errors.push(
                `${collection}: ${
                    error instanceof Error ? error.message : "unique id migration failed"
                }`
            );
        }
    }

    return {
        status:
            errors.length > 0
                ? IDENTITY_MIGRATION_STATUS.FAILED
                : IDENTITY_MIGRATION_STATUS.SUCCEEDED,
        gate,
        auditReport,
        indexesCreated,
        indexesSkipped,
        errors
    };
}

module.exports = {
    IDENTITY_AUDIT_PIPELINE,
    IDENTITY_MIGRATION_STATUS,
    IdentityMigrationBlockedError,
    collectIdentityAuditTargets,
    mapAggregationRowToDuplicateGroup,
    summarizeDuplicateGroups,
    buildIdentityDuplicateAuditReport,
    evaluateCleanAuditGate,
    scanDuplicateResourceIds,
    auditDuplicateResourceIds,
    resolveIdentityAuditClient,
    runExplicitUniqueIdIndexMigration
};
