const {
    scanTemporalDocument,
    loadDefinitions,
    TEMPORAL_CATEGORIES
} = require("./temporalPreflight");

const MIGRATION_BATCH_VALIDATION_MISSING_ID = "MIGRATION_BATCH_VALIDATION_MISSING_ID";
const MIGRATION_BATCH_VALIDATION_ID_CHANGED = "MIGRATION_BATCH_VALIDATION_ID_CHANGED";
const MIGRATION_BATCH_VALIDATION_VERSION_CHANGED = "MIGRATION_BATCH_VALIDATION_VERSION_CHANGED";
const MIGRATION_BATCH_VALIDATION_RESOURCE_TYPE = "MIGRATION_BATCH_VALIDATION_RESOURCE_TYPE";
const MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL = "MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL";
const MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL = "MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL";
const MIGRATION_BATCH_VALIDATION_AMBIGUOUS_TEMPORAL = "MIGRATION_BATCH_VALIDATION_AMBIGUOUS_TEMPORAL";

/**
 * @param {object} document
 * @param {number} [index]
 * @returns {unknown}
 */
function resolveDocumentId(document, index = 0) {
    if (Object.prototype.hasOwnProperty.call(document, "_id")) {
        return document._id;
    }
    if (Object.prototype.hasOwnProperty.call(document, "id")) {
        return document.id;
    }
    return index;
}

/**
 * @param {object} diagnostic
 * @returns {string}
 */
function temporalDiagnosticCode(diagnostic) {
    switch (diagnostic.category) {
        case TEMPORAL_CATEGORIES.INVALID:
            return MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL;
        case TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE:
            return MIGRATION_BATCH_VALIDATION_AMBIGUOUS_TEMPORAL;
        default:
            return MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL;
    }
}

/**
 * @param {object} diagnostic
 * @returns {string}
 */
function temporalDiagnosticMessage(diagnostic) {
    if (diagnostic.reason) {
        return diagnostic.reason;
    }
    return `Temporal value at ${diagnostic.path} is ${diagnostic.category}`;
}

/**
 * @param {object} document
 * @param {object} context
 * @param {import("./migrationContracts").MigrationSourceDescriptor} context.source
 * @param {object} [context.sourceDocument]
 * @param {number} [context.documentIndex]
 * @param {Record<string, object>} [context.definitions]
 * @returns {{ valid: boolean, errors: Array<{ documentId: unknown, path?: string, message: string, code?: string }> }}
 */
function validateTransformedDocument(document, context) {
    /** @type {Array<{ documentId: unknown, path?: string, message: string, code?: string }>} */
    const errors = [];
    const documentIndex = context.documentIndex ?? 0;
    const documentId = resolveDocumentId(document, documentIndex);
    const { source, sourceDocument } = context;
    const definitions = context.definitions || loadDefinitions();

    if (!Object.prototype.hasOwnProperty.call(document, "_id")) {
        errors.push({
            documentId,
            message: "Transformed document is missing _id",
            code: MIGRATION_BATCH_VALIDATION_MISSING_ID
        });
    }

    if (sourceDocument) {
        if (
            Object.prototype.hasOwnProperty.call(sourceDocument, "id") &&
            document.id !== sourceDocument.id
        ) {
            errors.push({
                documentId,
                path: "id",
                message: "Transformed document id does not match source id",
                code: MIGRATION_BATCH_VALIDATION_ID_CHANGED
            });
        }
        if (
            sourceDocument.meta?.versionId !== undefined &&
            document.meta?.versionId !== sourceDocument.meta.versionId
        ) {
            errors.push({
                documentId,
                path: "meta.versionId",
                message: "Transformed document meta.versionId does not match source meta.versionId",
                code: MIGRATION_BATCH_VALIDATION_VERSION_CHANGED
            });
        }
    }

    if (source.kind === "resource" && document.resourceType !== source.resource) {
        errors.push({
            documentId,
            path: "resourceType",
            message: `resourceType must be ${source.resource}`,
            code: MIGRATION_BATCH_VALIDATION_RESOURCE_TYPE
        });
    }

    const definition = definitions[source.resource];
    if (definition) {
        const diagnostics = scanTemporalDocument(
            document,
            definition,
            {
                resourceType: source.resource,
                model: source.model
            },
            definitions
        );

        for (const diagnostic of diagnostics) {
            if (diagnostic.category === TEMPORAL_CATEGORIES.CANONICAL) {
                continue;
            }
            errors.push({
                documentId,
                path: diagnostic.path,
                message: temporalDiagnosticMessage(diagnostic),
                code: temporalDiagnosticCode(diagnostic)
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * @param {object[]} documents
 * @param {object} context
 * @param {import("./migrationContracts").MigrationWriteContext} context
 * @param {object[]} [context.sourceDocuments]
 * @param {Record<string, object>} [context.definitions]
 * @returns {{ valid: boolean, errors: Array<{ documentId: unknown, path?: string, message: string, code?: string }> }}
 */
function validateTransformedBatch(documents, context) {
    /** @type {Array<{ documentId: unknown, path?: string, message: string, code?: string }>} */
    const errors = [];
    const definitions = context.definitions || loadDefinitions();
    const sourceDocuments = Array.isArray(context.sourceDocuments)
        ? context.sourceDocuments
        : [];

    for (let index = 0; index < documents.length; index++) {
        const result = validateTransformedDocument(documents[index], {
            source: context.source,
            sourceDocument: sourceDocuments[index],
            documentIndex: index,
            definitions
        });
        errors.push(...result.errors);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    MIGRATION_BATCH_VALIDATION_MISSING_ID,
    MIGRATION_BATCH_VALIDATION_ID_CHANGED,
    MIGRATION_BATCH_VALIDATION_VERSION_CHANGED,
    MIGRATION_BATCH_VALIDATION_RESOURCE_TYPE,
    MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL,
    MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL,
    MIGRATION_BATCH_VALIDATION_AMBIGUOUS_TEMPORAL,
    resolveDocumentId,
    validateTransformedDocument,
    validateTransformedBatch
};
