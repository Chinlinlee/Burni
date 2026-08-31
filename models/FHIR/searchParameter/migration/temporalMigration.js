const path = require("path");
const {
    TEMPORAL_CATEGORIES,
    mapTemporalDocument,
    readModelDocuments,
    resolveModel,
    runTemporalMigrationPreflight
} = require("./temporalPreflight");
const {
    convertLegacyTemporalValue
} = require("./temporalConversion");
const {
    isCanonicalTemporalObject,
    toPlainCanonicalValue
} = require("../../temporal");

const DEFAULT_BATCH_SIZE = 100;
const PREFLIGHT_FAILED_CODE = "TEMPORAL_MIGRATION_PREFLIGHT_FAILED";
const SOURCE_UNAVAILABLE_CODE = "TEMPORAL_MIGRATION_SOURCE_UNAVAILABLE";
const WRITE_FAILED_CODE = "TEMPORAL_MIGRATION_WRITE_FAILED";

class TemporalMigrationPreflightError extends Error {
    /**
     * @param {object} report
     */
    constructor(report) {
        super("Temporal migration preflight failed; no documents were written");
        this.name = "TemporalMigrationPreflightError";
        this.code = PREFLIGHT_FAILED_CODE;
        this.report = report;
        this.diagnostics = report.diagnostics;
        this.summary = report.summary;
    }
}

class TemporalMigrationWriteError extends Error {
    /**
     * @param {string} message
     * @param {object} metadata
     * @param {object} summary
     * @param {unknown} [cause]
     */
    constructor(message, metadata, summary, cause) {
        super(message);
        this.name = "TemporalMigrationWriteError";
        this.code = WRITE_FAILED_CODE;
        this.metadata = metadata;
        this.summary = summary;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

/**
 * @param {string} path
 * @returns {string}
 */
function toMongoPath(path) {
    return path.replace(/\[(\d+)\]/g, ".$1");
}

/**
 * @param {object} document
 * @param {string} modelName
 * @returns {Record<string, unknown>}
 */
function buildDocumentFilter(document, modelName) {
    if (document._id !== undefined) {
        return { _id: document._id };
    }

    if (document.id === undefined) {
        throw new Error(`Cannot update ${modelName} document without _id or id`);
    }

    const filter = { id: document.id };
    if (document.meta?.versionId !== undefined) {
        filter["meta.versionId"] = document.meta.versionId;
    }
    return filter;
}

/**
 * @param {object} input
 * @param {object} input.model
 * @param {object} input.document
 * @param {{ path: string, value: unknown }[]} input.changes
 * @param {string} input.modelName
 * @returns {Promise<unknown>}
 */
async function updateTemporalDocument({ model, document, changes, modelName }) {
    if (!model || typeof model.updateOne !== "function") {
        throw new Error(`Model ${modelName} does not expose updateOne`);
    }

    const updates = Object.fromEntries(
        changes.map((change) => [toMongoPath(change.path), change.value])
    );
    return model.updateOne(buildDocumentFilter(document, modelName), { $set: updates });
}

/**
 * @param {((event: Record<string, unknown>) => void) | { info?: (event: Record<string, unknown>) => void } | undefined} logger
 * @param {Record<string, unknown>} event
 */
function logMigrationEvent(logger, event) {
    if (typeof logger === "function") {
        logger(event);
        return;
    }
    if (logger && typeof logger.info === "function") {
        logger.info(event);
    }
}

/**
 * @param {object} summary
 * @returns {object}
 */
function cloneSummary(summary) {
    return { ...summary };
}

/**
 * @param {object} summary
 * @param {object} source
 * @param {number} batchNumber
 * @param {number} batchSize
 * @param {object} before
 * @param {((event: Record<string, unknown>) => void) | { info?: (event: Record<string, unknown>) => void } | undefined} logger
 */
function logBatchSummary(summary, source, batchNumber, batchSize, before, logger) {
    logMigrationEvent(logger, {
        event: "temporal-migration-batch",
        resource: source.resource,
        model: source.model,
        kind: source.kind,
        batchNumber,
        batchSize,
        processed: summary.processed - before.processed,
        updated: summary.updated - before.updated,
        skipped: summary.skipped - before.skipped,
        failed: summary.failed - before.failed,
        temporalValuesUpdated:
            summary.temporalValuesUpdated - before.temporalValuesUpdated
    });
}

/**
 * @param {object} input
 * @param {object} input.document
 * @param {object} input.definition
 * @param {object} input.source
 * @param {Record<string, object>} input.definitions
 * @param {object} summary
 * @param {(input: object) => Promise<unknown> | unknown} updateStrategy
 * @returns {Promise<{ updated: boolean, changeCount: number }>}
 */
async function migrateDocument({
    document,
    definition,
    source,
    definitions,
    summary,
    updateStrategy
}) {
    const changes = [];
    let conversionContext;
    let convertedDocument;

    try {
        convertedDocument = mapTemporalDocument(
            document,
            definition,
            { resourceType: source.resource, model: source.model },
            definitions,
            (value, type, path) => {
                if (isCanonicalTemporalObject(toPlainCanonicalValue(value), type)) {
                    return value;
                }

                conversionContext = { value, type, path };
                const converted = convertLegacyTemporalValue(
                    value,
                    type,
                    path,
                    { resource: source.resource, model: source.model }
                );
                changes.push({
                    path,
                    originalValue: value,
                    value: converted,
                    category:
                        value instanceof Date
                            ? TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
                            : TEMPORAL_CATEGORIES.LEGACY_STRING
                });
                return converted;
            }
        );
    } catch (error) {
        summary.failed += 1;
        throw new TemporalMigrationWriteError(
            `Temporal migration conversion failed at ${source.model}`,
            {
                resource: source.resource,
                model: source.model,
                path: error.path || conversionContext?.path,
                value: error.value ?? conversionContext?.value,
                category: error.category || TEMPORAL_CATEGORIES.INVALID
            },
            cloneSummary(summary),
            error
        );
    }

    if (changes.length === 0) {
        summary.skipped += 1;
        return { updated: false, changeCount: 0 };
    }

    try {
        await updateStrategy({
            model: source.modelInstance,
            modelName: source.model,
            resourceType: source.resource,
            kind: source.kind,
            document,
            convertedDocument,
            changes,
            update: {
                $set: Object.fromEntries(
                    changes.map((change) => [toMongoPath(change.path), change.value])
                )
            }
        });
    } catch (error) {
        summary.failed += 1;
        throw new TemporalMigrationWriteError(
            `Temporal migration write failed for ${source.model}`,
            {
                resource: source.resource,
                model: source.model,
                path: changes[0].path,
                value: changes[0].originalValue,
                category: changes[0].category
            },
            cloneSummary(summary),
            error
        );
    }

    summary.updated += 1;
    summary.temporalValuesUpdated += changes.length;
    return { updated: true, changeCount: changes.length };
}

/**
 * @param {object} input
 * @param {object} [input.models]
 * @param {string[]} [input.catalog]
 * @param {Record<string, object>} [input.definitions]
 * @param {boolean} [input.includeHistory]
 * @param {number} [input.batchSize]
 * @param {unknown} [input.logger]
 * @param {(input: object) => Promise<object>} [input.preflight]
 * @param {(input: object) => Promise<unknown> | unknown} [input.updateStrategy]
 * @returns {Promise<{ preflight: object, summary: object }>}
 */
async function runTemporalMigration({
    models = {},
    catalog,
    definitions,
    includeHistory = true,
    batchSize = DEFAULT_BATCH_SIZE,
    logger = console,
    preflight = runTemporalMigrationPreflight,
    updateStrategy = updateTemporalDocument
}) {
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
        throw new RangeError("Temporal migration batchSize must be a positive integer");
    }

    const preflightReport = await preflight({
        models,
        ...(catalog === undefined ? {} : { catalog }),
        ...(definitions === undefined ? {} : { definitions }),
        includeHistory
    });
    const unavailableSources = (preflightReport.sources || []).filter(
        (source) => source.available === false
    );
    if (unavailableSources.length > 0) {
        throw new TemporalMigrationPreflightError({
            ...preflightReport,
            valid: false,
            gateFailure: {
                code: SOURCE_UNAVAILABLE_CODE,
                sources: unavailableSources
            },
            summary: {
                ...preflightReport.summary,
                unavailableSources: unavailableSources.length
            }
        });
    }
    if (!preflightReport.valid) {
        throw new TemporalMigrationPreflightError(preflightReport);
    }

    const resolvedCatalog = catalog || require("../../fhir.resourceList.json");
    const resolvedDefinitions =
        definitions ||
        require(path.join(__dirname, "../../../../FHIR-mongoose-Models-Generator/fhir.schema.json"))
            .definitions;
    const summary = {
        batchSize,
        batches: 0,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        temporalValuesUpdated: 0
    };

    for (const resourceType of resolvedCatalog) {
        const definition = resolvedDefinitions[resourceType];
        if (!definition) {
            continue;
        }

        const sources = [
            { modelName: resourceType, kind: "resource" },
            ...(includeHistory
                ? [{ modelName: `${resourceType}_history`, kind: "history" }]
                : [])
        ];

        for (const sourceDefinition of sources) {
            const model = resolveModel(models, sourceDefinition.modelName);
            if (!model) {
                continue;
            }

            const documents = await readModelDocuments(model);
            for (let offset = 0; offset < documents.length; offset += batchSize) {
                const batch = documents.slice(offset, offset + batchSize);
                const before = cloneSummary(summary);
                const source = {
                    resource: resourceType,
                    model: sourceDefinition.modelName,
                    kind: sourceDefinition.kind,
                    modelInstance: model
                };

                try {
                    for (const document of batch) {
                        summary.processed += 1;
                        await migrateDocument({
                            document,
                            definition,
                            source,
                            definitions: resolvedDefinitions,
                            summary,
                            updateStrategy
                        });
                    }
                } finally {
                    summary.batches += 1;
                    logBatchSummary(
                        summary,
                        source,
                        summary.batches,
                        batch.length,
                        before,
                        logger
                    );
                }
            }
        }
    }

    const result = { preflight: preflightReport, summary };
    logMigrationEvent(logger, {
        event: "temporal-migration-summary",
        ...summary,
        preflightValid: preflightReport.valid
    });
    return result;
}

module.exports = {
    DEFAULT_BATCH_SIZE,
    PREFLIGHT_FAILED_CODE,
    SOURCE_UNAVAILABLE_CODE,
    WRITE_FAILED_CODE,
    TemporalMigrationPreflightError,
    TemporalMigrationWriteError,
    buildDocumentFilter,
    toMongoPath,
    updateTemporalDocument,
    runTemporalMigration,
    migrateTemporalData: runTemporalMigration
};
