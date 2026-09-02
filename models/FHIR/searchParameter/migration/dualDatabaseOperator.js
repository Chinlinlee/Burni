const mongoose = require("mongoose");
const productionCatalog = require("../../fhir.resourceList.json");
const {
    buildCatalogSourceDescriptors,
    createSourceReader
} = require("./sourceReader");
const { createDocumentTransformer, DocumentTransformError } = require("./documentTransformer");
const {
    scanTemporalDocument,
    loadDefinitions,
    TEMPORAL_CATEGORIES
} = require("./temporalPreflight");
const { validateMigrationRunIdentity } = require("./migrationContracts");

const PREFLIGHT_FAILED_CODE = "DUAL_DATABASE_PREFLIGHT_FAILED";
const MIGRATION_FAILED_CODE = "DUAL_DATABASE_MIGRATION_FAILED";

class DualDatabasePreflightError extends Error {
    /**
     * @param {object} report
     */
    constructor(report) {
        super("Dual database preflight failed; no documents were written");
        this.name = "DualDatabasePreflightError";
        this.code = PREFLIGHT_FAILED_CODE;
        this.report = report;
        this.diagnostics = report.diagnostics;
        this.summary = report.summary;
    }
}

class DualDatabaseMigrationError extends Error {
    /**
     * @param {string} message
     * @param {object} [metadata]
     * @param {object} [summary]
     * @param {unknown} [cause]
     */
    constructor(message, metadata, summary, cause) {
        super(message);
        this.name = "DualDatabaseMigrationError";
        this.code = MIGRATION_FAILED_CODE;
        this.metadata = metadata || {};
        this.summary = summary;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

/**
 * @param {string} uri
 * @returns {string}
 */
function redactUriCredentials(uri) {
    if (typeof uri !== "string") {
        return "";
    }
    return uri.replace(/\/\/([^@/]+)@/u, "//***@");
}

/**
 * @param {string} uri
 * @param {import("mongoose").Connection} connection
 * @returns {string}
 */
function deriveDatabaseIdentity(uri, connection) {
    const dbName = connection.db?.databaseName || "unknown";
    let host = "unknown";
    try {
        const sanitized = redactUriCredentials(uri);
        const match = sanitized.match(/^mongodb(?:\+srv)?:\/\/(?:[^/]+@)?([^/?]+)/u);
        if (match) {
            host = match[1];
        }
    } catch {
        host = "unknown";
    }
    return `${host}/${dbName}`;
}

/**
 * @param {object} input
 * @param {string} input.runId
 * @param {string} input.sourceDatabaseIdentity
 * @param {string} input.targetDatabaseIdentity
 * @returns {import("./migrationContracts").MigrationRunIdentity}
 */
function buildMigrationRunIdentity({
    runId,
    sourceDatabaseIdentity,
    targetDatabaseIdentity
}) {
    const runIdentity = { runId, sourceDatabaseIdentity, targetDatabaseIdentity };
    validateMigrationRunIdentity(runIdentity);
    return runIdentity;
}

/**
 * @param {object} input
 * @param {string} input.sourceUri
 * @param {string} input.targetUri
 * @returns {Promise<{
 *   sourceConnection: import("mongoose").Connection,
 *   targetConnection: import("mongoose").Connection,
 *   sourceDatabaseIdentity: string,
 *   targetDatabaseIdentity: string,
 *   close: () => Promise<void>
 * }>}
 */
async function createDualDatabaseConnections({ sourceUri, targetUri }) {
    if (typeof sourceUri !== "string" || sourceUri.trim() === "") {
        throw new Error("createDualDatabaseConnections requires a non-empty sourceUri");
    }
    if (typeof targetUri !== "string" || targetUri.trim() === "") {
        throw new Error("createDualDatabaseConnections requires a non-empty targetUri");
    }

    const sourceConnection = mongoose.createConnection(sourceUri);
    const targetConnection = mongoose.createConnection(targetUri);
    await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);

    if (
        sourceConnection.db?.databaseName &&
        targetConnection.db?.databaseName &&
        sourceConnection.db.databaseName === targetConnection.db.databaseName &&
        String(sourceConnection.host) === String(targetConnection.host) &&
        sourceConnection.port === targetConnection.port
    ) {
        await Promise.all([
            sourceConnection.close().catch(() => {}),
            targetConnection.close().catch(() => {})
        ]);
        throw new Error("Source and target connections resolve to the same database");
    }

    return {
        sourceConnection,
        targetConnection,
        sourceDatabaseIdentity: deriveDatabaseIdentity(sourceUri, sourceConnection),
        targetDatabaseIdentity: deriveDatabaseIdentity(targetUri, targetConnection),
        async close() {
            await Promise.all([
                sourceConnection.close().catch(() => {}),
                targetConnection.close().catch(() => {})
            ]);
        }
    };
}

/**
 * @param {import("mongoose").Connection} sourceConnection
 * @returns {import("mongodb").Db}
 */
function requireNativeDb(sourceConnection) {
    const db = sourceConnection.db;
    if (!db || typeof db.collection !== "function") {
        throw new Error(
            "Dual database operator requires a connected Mongoose connection with db.collection"
        );
    }
    return db;
}

/**
 * @param {object} unavailableSource
 * @param {string} reason
 * @param {string} [message]
 * @returns {{ source: object, diagnostic: object }}
 */
function buildUnavailableSource(unavailableSource, reason, message) {
    const diagnostic = {
        code: "temporal-preflight-source-unavailable",
        category: "unavailable-source",
        unresolved: true,
        message:
            message ||
            `Temporal preflight source is unavailable: ${unavailableSource.model}`,
        reason,
        ...unavailableSource
    };
    return { source: unavailableSource, diagnostic };
}

/**
 * @param {Array<object>} diagnostics
 * @param {Array<object>} sources
 * @param {string[]} catalog
 * @returns {{
 *   readOnly: true,
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   sources: Array<object>,
 *   summary: Record<string, number>
 * }}
 */
function buildPreflightReport(diagnostics, sources, catalog) {
    const unavailableSources = sources.filter((source) => !source.available).length;
    const temporalDiagnostics = diagnostics.filter((diagnostic) =>
        Object.values(TEMPORAL_CATEGORIES).includes(diagnostic.category)
    );
    const lossyBsonDates = temporalDiagnostics.filter(
        (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
    ).length;
    const unresolvedAmbiguousBsonDates = temporalDiagnostics.filter(
        (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
    ).length;
    const documentsScanned = sources
        .filter((source) => source.available)
        .reduce((total, source) => total + source.documentCount, 0);

    const summary = {
        resourcesInCatalog: catalog.length,
        sourcesScanned: sources.filter((source) => source.available).length,
        unavailableSources,
        documentsScanned,
        temporalValuesScanned: temporalDiagnostics.length,
        canonical: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.CANONICAL
        ).length,
        legacyStrings: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.LEGACY_STRING
        ).length,
        lossyBsonDates,
        unresolvedAmbiguousBsonDates,
        /** @deprecated use lossyBsonDates */
        absoluteBsonDates: lossyBsonDates,
        /** @deprecated use unresolvedAmbiguousBsonDates */
        ambiguousBsonDates: unresolvedAmbiguousBsonDates,
        invalid: temporalDiagnostics.filter(
            (diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.INVALID
        ).length
    };

    return {
        readOnly: true,
        valid:
            summary.invalid === 0 &&
            summary.unresolvedAmbiguousBsonDates === 0 &&
            summary.unavailableSources === 0,
        diagnostics,
        sources,
        summary
    };
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {Record<string, object>} [input.definitions]
 * @returns {Promise<ReturnType<typeof buildPreflightReport>>}
 */
async function runDualDatabasePreflight({
    sourceConnection,
    catalog = productionCatalog,
    includeHistory = true,
    batchSize,
    definitions = loadDefinitions()
}) {
    const db = requireNativeDb(sourceConnection);
    const diagnostics = [];
    const sources = [];
    const reader = createSourceReader({ sourceConnection, batchSize });

    try {
        for (const source of buildCatalogSourceDescriptors(catalog, includeHistory)) {
            const resourceDefinition = definitions[source.resource];
            const baseSource = {
                resource: source.resource,
                model: source.model,
                kind: source.kind,
                available: false,
                documentCount: 0
            };

            if (!resourceDefinition) {
                const { source: unavailableSource, diagnostic } = buildUnavailableSource(
                    baseSource,
                    "resource-definition-unavailable"
                );
                sources.push(unavailableSource);
                diagnostics.push(diagnostic);
                continue;
            }

            let collectionExists;
            try {
                const collections = await db
                    .listCollections({ name: source.collectionName })
                    .toArray();
                collectionExists = collections.length > 0;
            } catch (error) {
                const { source: unavailableSource, diagnostic } = buildUnavailableSource(
                    baseSource,
                    "source-read-failed",
                    error instanceof Error ? error.message : String(error)
                );
                sources.push(unavailableSource);
                diagnostics.push(diagnostic);
                continue;
            }

            if (!collectionExists) {
                continue;
            }

            let hasDocuments;
            try {
                hasDocuments =
                    (await db
                        .collection(source.collectionName)
                        .countDocuments({}, { limit: 1 })) > 0;
            } catch (error) {
                const { source: unavailableSource, diagnostic } = buildUnavailableSource(
                    baseSource,
                    "source-read-failed",
                    error instanceof Error ? error.message : String(error)
                );
                sources.push(unavailableSource);
                diagnostics.push(diagnostic);
                continue;
            }

            if (!hasDocuments) {
                sources.push({
                    ...baseSource,
                    available: true,
                    documentCount: 0
                });
                continue;
            }

            /** @type {import("./migrationContracts").MigrationBatchBoundary | undefined} */
            let boundary;
            let documentCount = 0;
            let readFailed = false;

            do {
                let result;
                try {
                    result = await reader.readBatch(source, boundary);
                } catch (error) {
                    const { source: unavailableSource, diagnostic } = buildUnavailableSource(
                        baseSource,
                        "source-read-failed",
                        error instanceof Error ? error.message : String(error)
                    );
                    sources.push(unavailableSource);
                    diagnostics.push(diagnostic);
                    readFailed = true;
                    break;
                }

                if (result.documents.length === 0) {
                    break;
                }

                for (let index = 0; index < result.documents.length; index++) {
                    documentCount++;
                    diagnostics.push(
                        ...scanTemporalDocument(
                            result.documents[index],
                            resourceDefinition,
                            {
                                resourceType: source.resource,
                                model: source.model,
                                documentIndex: index
                            },
                            definitions
                        )
                    );
                }

                boundary = result.nextBoundary ?? undefined;
            } while (boundary);

            if (!readFailed) {
                sources.push({
                    ...baseSource,
                    available: true,
                    documentCount
                });
            }
        }
    } finally {
        await reader.close();
    }

    return buildPreflightReport(diagnostics, sources, catalog);
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {import("./migrationContracts").MigrationRunIdentity} input.runIdentity
 * @param {{ info?: Function, warn?: Function, error?: Function }} [input.logger]
 * @param {boolean} [input.runPreflight]
 * @param {Record<string, object>} [input.definitions]
 * @param {string} [input.auditPath]
 * @returns {Promise<{
 *   preflight?: ReturnType<typeof buildPreflightReport>,
 *   summary: { documentsProcessed: number, batchesProcessed: number, auditEntries: import("./migrationContracts").AuditRecord[] },
 *   runIdentity: import("./migrationContracts").MigrationRunIdentity
 * }>}
 */
async function runDualDatabaseDryRun({
    sourceConnection,
    catalog = productionCatalog,
    includeHistory = true,
    batchSize,
    runIdentity,
    logger,
    runPreflight = false,
    definitions,
    auditPath
}) {
    validateMigrationRunIdentity(runIdentity);
    requireNativeDb(sourceConnection);

    const log = {
        info: typeof logger?.info === "function" ? logger.info.bind(logger) : () => {},
        warn: typeof logger?.warn === "function" ? logger.warn.bind(logger) : () => {},
        error: typeof logger?.error === "function" ? logger.error.bind(logger) : () => {}
    };

    /** @type {ReturnType<typeof buildPreflightReport> | undefined} */
    let preflight;
    if (runPreflight) {
        preflight = await runDualDatabasePreflight({
            sourceConnection,
            catalog,
            includeHistory,
            batchSize,
            definitions
        });
        if (!preflight.valid) {
            throw new DualDatabaseMigrationError(
                "Dual database dry-run preflight failed",
                { phase: "preflight" },
                preflight.summary
            );
        }
    }

    const documentTransformer = createDocumentTransformer({ definitions });
    let documentsProcessed = 0;
    let batchesProcessed = 0;
    /** @type {import("./migrationContracts").AuditRecord[]} */
    const auditEntries = [];
    const { createAuditWriter } = require("./auditWriter");
    const auditWriter = auditPath
        ? createAuditWriter({
              runId: runIdentity.runId,
              artifactPath: auditPath
          })
        : null;

    const { createCatalogSourceIterator } = require("./sourceReader");

    try {
        for await (const batch of createCatalogSourceIterator({
            sourceConnection,
            catalog,
            includeHistory,
            batchSize
        })) {
            const { source, documents, boundary } = batch;
            if (!boundary || documents.length === 0) {
                continue;
            }

            try {
                const transformedBatch = documentTransformer.transformBatch(documents, {
                    runIdentity,
                    source,
                    batchId: boundary.batchId
                });
                auditEntries.push(...transformedBatch.flatMap((entry) => entry.auditEntries));
                if (auditWriter && transformedBatch.some((entry) => entry.auditEntries.length > 0)) {
                    await auditWriter.append(
                        transformedBatch.flatMap((entry) => entry.auditEntries)
                    );
                }
                documentsProcessed += documents.length;
                batchesProcessed += 1;
                log.info("Dry-run batch transformed", {
                    batchId: boundary.batchId,
                    collection: boundary.collection,
                    documentCount: documents.length
                });
            } catch (error) {
                const metadata =
                    error instanceof DocumentTransformError
                        ? { ...error.metadata, phase: "transform" }
                        : { phase: "transform" };
                throw new DualDatabaseMigrationError(
                    error instanceof Error ? error.message : String(error),
                    metadata,
                    { documentsProcessed, batchesProcessed, auditEntries },
                    error
                );
            }
        }
    } catch (error) {
        if (error instanceof DualDatabaseMigrationError) {
            throw error;
        }
        throw new DualDatabaseMigrationError(
            error instanceof Error ? error.message : String(error),
            { phase: "dry-run" },
            { documentsProcessed, batchesProcessed, auditEntries },
            error
        );
    } finally {
        if (auditWriter) {
            await auditWriter.flush();
        }
    }

    return {
        ...(preflight ? { preflight } : {}),
        summary: {
            documentsProcessed,
            batchesProcessed,
            auditEntries
        },
        runIdentity
    };
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {import("mongoose").Connection} input.targetConnection
 * @param {import("./migrationContracts").MigrationRunIdentity} input.runIdentity
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {number} [input.maxBatches]
 * @param {string} [input.auditPath]
 * @param {{ info?: Function, warn?: Function, error?: Function }} [input.logger]
 * @returns {Promise<{
 *   runIdentity: import("./migrationContracts").MigrationRunIdentity,
 *   preflight: ReturnType<typeof buildPreflightReport>,
 *   summary: Awaited<ReturnType<typeof import("./streamingMigration").runStreamingMigration>>
 * }>}
 */
async function runDualDatabaseWrite({
    sourceConnection,
    targetConnection,
    runIdentity,
    catalog = productionCatalog,
    includeHistory = true,
    batchSize,
    maxBatches,
    auditPath,
    logger
}) {
    validateMigrationRunIdentity(runIdentity);
    requireNativeDb(sourceConnection);
    requireNativeDb(targetConnection);

    const preflight = await runDualDatabasePreflight({
        sourceConnection,
        catalog,
        includeHistory,
        batchSize
    });
    if (!preflight.valid) {
        throw new DualDatabasePreflightError(preflight);
    }

    const { discoverModelFilesForCatalog, registerDiscoveredModels } = require("../../../mongodb/connector");
    const { runStreamingMigration } = require("./streamingMigration");
    const discovered = discoverModelFilesForCatalog(catalog, includeHistory);
    const targetModels = {};
    registerDiscoveredModels(discovered, targetModels, targetConnection);

    const summary = await runStreamingMigration({
        sourceConnection,
        targetConnection,
        runIdentity,
        catalog,
        includeHistory,
        batchSize,
        maxBatches,
        logger,
        targetModels,
        discovered,
        auditPath
    });

    if (summary.status !== "complete") {
        throw new DualDatabaseMigrationError(
            "Dual database migration did not complete successfully",
            { phase: "write" },
            summary
        );
    }

    return { runIdentity, preflight, summary };
}

module.exports = {
    PREFLIGHT_FAILED_CODE,
    MIGRATION_FAILED_CODE,
    DualDatabasePreflightError,
    DualDatabaseMigrationError,
    buildMigrationRunIdentity,
    createDualDatabaseConnections,
    deriveDatabaseIdentity,
    redactUriCredentials,
    runDualDatabasePreflight,
    runDualDatabaseDryRun,
    runDualDatabaseWrite
};
