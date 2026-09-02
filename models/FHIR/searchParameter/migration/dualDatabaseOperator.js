const os = require("os");
const path = require("path");
const mongoose = require("mongoose");
const productionCatalog = require("../../fhir.resourceList.json");
const {
    buildCatalogSourceDescriptors,
    createCatalogSourceIterator,
    createSourceReader
} = require("./sourceReader");
const {
    createDocumentTransformer,
    DocumentTransformError
} = require("./documentTransformer");
const { createTargetBatchWriter } = require("./targetBatchWriter");
const {
    createCheckpointWriter,
    resolveCheckpointModel
} = require("./checkpointWriter");
const { createAuditWriter } = require("./auditWriter");
const {
    scanTemporalDocument,
    loadDefinitions,
    TEMPORAL_CATEGORIES
} = require("./temporalPreflight");
const {
    validateMigrationRunIdentity,
    MigrationContractError,
    MIGRATION_CONTRACT_INVALID_CONFIG
} = require("./migrationContracts");

const PREFLIGHT_FAILED_CODE = "DUAL_DATABASE_PREFLIGHT_FAILED";
const MIGRATION_FAILED_CODE = "DUAL_DATABASE_MIGRATION_FAILED";
const INCOMPLETE_CHECKPOINT_STATUSES = Object.freeze(["pending", "started", "failed"]);

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
 * @param {unknown} connection
 * @param {string} fieldName
 */
function requireMongooseConnection(connection, fieldName) {
    if (
        connection === null ||
        typeof connection !== "object" ||
        Array.isArray(connection) ||
        (typeof /** @type {Record<string, unknown>} */ (connection).model !== "function" &&
            (/** @type {Record<string, unknown>} */ (connection).db === null ||
                typeof /** @type {Record<string, unknown>} */ (connection).db !== "object"))
    ) {
        throw new MigrationContractError(
            `dual database migration requires a Mongoose connection for ${fieldName}`,
            MIGRATION_CONTRACT_INVALID_CONFIG,
            { field: fieldName }
        );
    }
}

/**
 * @param {{ info?: Function, warn?: Function, error?: Function }} [logger]
 */
function normalizeLogger(logger) {
    return {
        info: typeof logger?.info === "function" ? logger.info.bind(logger) : () => {},
        warn: typeof logger?.warn === "function" ? logger.warn.bind(logger) : () => {},
        error: typeof logger?.error === "function" ? logger.error.bind(logger) : () => {}
    };
}

/**
 * @param {unknown} error
 * @returns {{ message: string, code?: string }}
 */
function formatBatchError(error) {
    if (error instanceof DocumentTransformError) {
        return {
            message: error.message,
            code: error.code
        };
    }
    if (error instanceof Error) {
        return { message: error.message };
    }
    return { message: String(error) };
}

/**
 * @param {import("./migrationContracts").MigrationRunIdentity | string} runIdentity
 * @param {import("mongoose").Connection} targetConnection
 * @returns {Promise<boolean>}
 */
async function isMigrationRunComplete(runIdentity, targetConnection) {
    requireMongooseConnection(targetConnection, "targetConnection");
    const runId =
        typeof runIdentity === "string"
            ? runIdentity
            : (validateMigrationRunIdentity(runIdentity), runIdentity.runId);

    const CheckpointModel = resolveCheckpointModel(targetConnection);
    const incompleteCount = await CheckpointModel.countDocuments({
        runId,
        status: { $in: [...INCOMPLETE_CHECKPOINT_STATUSES] }
    });
    if (incompleteCount > 0) {
        return false;
    }

    const runCompletion = await CheckpointModel.findOne({
        runId,
        collection: "_run",
        batchId: "_complete",
        status: "completed"
    }).lean();
    return runCompletion !== null;
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
 * @param {"dry-run" | "write"} input.mode
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {import("mongoose").Connection} [input.targetConnection]
 * @param {import("./migrationContracts").MigrationRunIdentity} input.runIdentity
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {number} [input.maxBatches]
 * @param {string} [input.auditPath]
 * @param {{ info?: Function, warn?: Function, error?: Function }} [input.logger]
 * @param {boolean} [input.resume]
 * @param {Record<string, object>} [input.definitions]
 * @param {Record<string, import("mongoose").Model>} [input.targetModels]
 * @param {ReturnType<typeof import("../../../mongodb/connector").discoverModelFiles>} [input.discovered]
 * @returns {Promise<
 *   | { documentsProcessed: number, batchesProcessed: number, auditEntries: import("./migrationContracts").AuditRecord[] }
 *   | {
 *       runIdentity: import("./migrationContracts").MigrationRunIdentity,
 *       batchesCompleted: number,
 *       batchesFailed: number,
 *       batchesSkipped: number,
 *       documentsProcessed: number,
 *       status: "complete" | "incomplete"
 *     }
 * >}
 */
async function runMigrationBatchLoop({
    mode,
    sourceConnection,
    targetConnection,
    runIdentity,
    catalog = productionCatalog,
    includeHistory = true,
    batchSize,
    maxBatches,
    auditPath,
    logger,
    resume = true,
    definitions,
    targetModels,
    discovered
}) {
    const isWrite = mode === "write";
    validateMigrationRunIdentity(runIdentity);
    requireMongooseConnection(sourceConnection, "sourceConnection");
    if (isWrite) {
        requireMongooseConnection(targetConnection, "targetConnection");
    }

    const log = normalizeLogger(logger);
    const documentTransformer = createDocumentTransformer({ definitions });
    const targetBatchWriter = isWrite
        ? createTargetBatchWriter({
              targetConnection,
              runId: runIdentity.runId,
              targetModels,
              discovered
          })
        : null;
    const checkpointWriter = isWrite
        ? createCheckpointWriter({ targetConnection, runIdentity })
        : null;

    /** @type {import("./migrationContracts").AuditWriter | null} */
    let auditWriter = null;
    if (isWrite || auditPath) {
        auditWriter = createAuditWriter({
            runId: runIdentity.runId,
            artifactPath:
                auditPath ||
                path.join(os.tmpdir(), `temporal-migration-audit-${runIdentity.runId}.jsonl`)
        });
    }

    /** @type {import("./migrationContracts").AuditRecord[]} */
    const dryRunAuditEntries = [];
    /** @type {{
     *   runIdentity: import("./migrationContracts").MigrationRunIdentity,
     *   batchesCompleted: number,
     *   batchesFailed: number,
     *   batchesSkipped: number,
     *   documentsProcessed: number,
     *   status: "complete" | "incomplete"
     * }} */
    const writeSummary = isWrite
        ? {
              runIdentity,
              batchesCompleted: 0,
              batchesFailed: 0,
              batchesSkipped: 0,
              documentsProcessed: 0,
              status: "incomplete"
          }
        : null;
    let dryRunDocumentsProcessed = 0;
    let dryRunBatchesProcessed = 0;

    let catalogExhausted = false;
    let batchesHandled = 0;

    try {
        for await (const batch of createCatalogSourceIterator({
            sourceConnection,
            catalog,
            includeHistory,
            batchSize
        })) {
            if (typeof maxBatches === "number" && batchesHandled >= maxBatches) {
                break;
            }

            const { source, documents, boundary } = batch;
            if (!boundary || documents.length === 0) {
                continue;
            }

            const { batchId, collection } = boundary;
            batchesHandled += 1;

            if (isWrite && resume) {
                const existingCheckpoint = await checkpointWriter.getCheckpoint(
                    runIdentity.runId,
                    collection,
                    batchId
                );
                if (existingCheckpoint?.status === "completed") {
                    writeSummary.batchesSkipped += 1;
                    writeSummary.documentsProcessed +=
                        existingCheckpoint.counts?.sourceCount ?? documents.length;
                    log.info("Skipping completed batch", { batchId, collection });
                    continue;
                }
            }

            if (isWrite) {
                await checkpointWriter.markBatchStarted({
                    runId: runIdentity.runId,
                    collection,
                    batchId,
                    status: "started",
                    counts: {},
                    sourceIds: boundary.sourceIds,
                    boundary
                });
            }

            try {
                const transformContext = {
                    runIdentity,
                    source,
                    batchId
                };
                const transformedBatch = documentTransformer.transformBatch(
                    documents,
                    transformContext
                );
                const transformedDocuments = transformedBatch.map((entry) => entry.document);
                const auditEntries = transformedBatch.flatMap((entry) => entry.auditEntries);

                if (auditWriter && auditEntries.length > 0) {
                    await auditWriter.append(auditEntries);
                    await auditWriter.flush();
                }
                if (!isWrite) {
                    dryRunAuditEntries.push(...auditEntries);
                }

                if (isWrite) {
                    const writeResult = await targetBatchWriter.writeBatch(
                        collection,
                        transformedDocuments,
                        {
                            runIdentity,
                            source,
                            batchId,
                            sourceDocuments: documents
                        }
                    );

                    if (writeResult.status !== "completed") {
                        await checkpointWriter.markBatchFailed({
                            runId: runIdentity.runId,
                            collection,
                            batchId,
                            status: "failed",
                            counts: {
                                sourceCount: writeResult.sourceCount,
                                targetCount: writeResult.targetCount
                            },
                            sourceIds: boundary.sourceIds,
                            boundary,
                            errorMetadata: {
                                message:
                                    writeResult.errors[0]?.message || "target batch write failed",
                                code: writeResult.errors[0]?.code,
                                at: new Date().toISOString()
                            }
                        });
                        writeSummary.batchesFailed += 1;
                        log.error("Batch write failed", {
                            batchId,
                            collection,
                            errors: writeResult.errors
                        });
                        continue;
                    }

                    await checkpointWriter.markBatchCompleted({
                        runId: runIdentity.runId,
                        collection,
                        batchId,
                        status: "completed",
                        counts: {
                            sourceCount: writeResult.sourceCount,
                            targetCount: writeResult.targetCount
                        },
                        sourceIds: boundary.sourceIds,
                        boundary
                    });
                    writeSummary.batchesCompleted += 1;
                    writeSummary.documentsProcessed += writeResult.sourceCount;
                    log.info("Batch completed", {
                        batchId,
                        collection,
                        sourceCount: writeResult.sourceCount
                    });
                } else {
                    dryRunDocumentsProcessed += documents.length;
                    dryRunBatchesProcessed += 1;
                    log.info("Dry-run batch transformed", {
                        batchId,
                        collection,
                        documentCount: documents.length
                    });
                }
            } catch (error) {
                if (!isWrite) {
                    const metadata =
                        error instanceof DocumentTransformError
                            ? { ...error.metadata, phase: "transform" }
                            : { phase: "transform" };
                    throw new DualDatabaseMigrationError(
                        error instanceof Error ? error.message : String(error),
                        metadata,
                        {
                            documentsProcessed: dryRunDocumentsProcessed,
                            batchesProcessed: dryRunBatchesProcessed,
                            auditEntries: dryRunAuditEntries
                        },
                        error
                    );
                }

                const formatted = formatBatchError(error);
                await checkpointWriter.markBatchFailed({
                    runId: runIdentity.runId,
                    collection,
                    batchId,
                    status: "failed",
                    counts: {},
                    sourceIds: boundary.sourceIds,
                    boundary,
                    errorMetadata: {
                        message: formatted.message,
                        code: formatted.code,
                        at: new Date().toISOString()
                    }
                });
                writeSummary.batchesFailed += 1;
                log.error("Batch processing failed", {
                    batchId,
                    collection,
                    message: formatted.message
                });
            }
        }
    } catch (error) {
        if (!isWrite) {
            if (error instanceof DualDatabaseMigrationError) {
                throw error;
            }
            throw new DualDatabaseMigrationError(
                error instanceof Error ? error.message : String(error),
                { phase: "dry-run" },
                {
                    documentsProcessed: dryRunDocumentsProcessed,
                    batchesProcessed: dryRunBatchesProcessed,
                    auditEntries: dryRunAuditEntries
                },
                error
            );
        }
        throw error;
    } finally {
        if (auditWriter) {
            await auditWriter.flush();
        }
    }

    catalogExhausted = typeof maxBatches !== "number" || batchesHandled < maxBatches;

    if (isWrite) {
        const runComplete = writeSummary.batchesFailed === 0 && catalogExhausted;
        writeSummary.status = runComplete ? "complete" : "incomplete";
        if (runComplete) {
            await checkpointWriter.markRunCompleted(runIdentity.runId);
        }
        return writeSummary;
    }

    return {
        documentsProcessed: dryRunDocumentsProcessed,
        batchesProcessed: dryRunBatchesProcessed,
        auditEntries: dryRunAuditEntries
    };
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

    const summary = await runMigrationBatchLoop({
        mode: "dry-run",
        sourceConnection,
        runIdentity,
        catalog,
        includeHistory,
        batchSize,
        auditPath,
        logger,
        definitions
    });

    return {
        ...(preflight ? { preflight } : {}),
        summary,
        runIdentity
    };
}

/**
 * Write-mode batch loop for resume and checkpoint tests.
 *
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
 * @param {boolean} [input.resume]
 * @param {Record<string, import("mongoose").Model>} [input.targetModels]
 * @param {ReturnType<typeof import("../../../mongodb/connector").discoverModelFiles>} [input.discovered]
 * @returns {Promise<{
 *   runIdentity: import("./migrationContracts").MigrationRunIdentity,
 *   batchesCompleted: number,
 *   batchesFailed: number,
 *   batchesSkipped: number,
 *   documentsProcessed: number,
 *   status: "complete" | "incomplete"
 * }>}
 */
async function runDualDatabaseMigrationBatchLoop(input) {
    const summary = await runMigrationBatchLoop({
        mode: "write",
        ...input
    });
    return /** @type {Exclude<typeof summary, { batchesProcessed: number }>} */ (summary);
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
 *   summary: Awaited<ReturnType<typeof runDualDatabaseMigrationBatchLoop>>
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
    const discovered = discoverModelFilesForCatalog(catalog, includeHistory);
    const targetModels = {};
    registerDiscoveredModels(discovered, targetModels, targetConnection);

    const summary = await runDualDatabaseMigrationBatchLoop({
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
    INCOMPLETE_CHECKPOINT_STATUSES,
    DualDatabasePreflightError,
    DualDatabaseMigrationError,
    buildMigrationRunIdentity,
    createDualDatabaseConnections,
    deriveDatabaseIdentity,
    redactUriCredentials,
    runDualDatabasePreflight,
    runDualDatabaseDryRun,
    runDualDatabaseWrite,
    runDualDatabaseMigrationBatchLoop,
    isMigrationRunComplete
};
