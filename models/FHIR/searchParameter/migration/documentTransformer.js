const {
    processTemporalDocument,
    loadDefinitions,
    TEMPORAL_CATEGORIES
} = require("./temporalDocumentTransform");

const TRANSFORM_FAILED_CODE = "DOCUMENT_TRANSFORM_FAILED";

class DocumentTransformError extends Error {
    /**
     * @param {string} message
     * @param {Record<string, unknown>} metadata
     * @param {unknown} [cause]
     */
    constructor(message, metadata, cause) {
        super(message);
        this.name = "DocumentTransformError";
        this.code = TRANSFORM_FAILED_CODE;
        this.metadata = metadata;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

/**
 * @param {object} config
 * @param {Record<string, object>} [config.definitions]
 * @returns {import("./migrationContracts").DocumentTransformer & { transformBatch: (documents: object[], context: import("./migrationContracts").MigrationTransformContext) => Array<{ document: object, auditEntries: import("./migrationContracts").AuditRecord[], diagnostics: object[] }> }}
 */
function createDocumentTransformer(config = {}) {
    const definitions = config.definitions || loadDefinitions();

    /**
     * @param {object} sourceDoc
     * @param {import("./migrationContracts").MigrationTransformContext} context
     */
    function transformDocument(sourceDoc, context) {
        const { source } = context;
        const definition = definitions[source.resource];
        if (!definition) {
            throw new DocumentTransformError(
                `No FHIR definition for resource ${source.resource}`,
                {
                    resource: source.resource,
                    model: source.model,
                    batchId: context.batchId,
                    sourceDocumentId: sourceDoc._id ?? sourceDoc.id
                }
            );
        }

        /** @type {{ value: unknown, type: string, path: string } | undefined} */
        let conversionContext;

        try {
            const {
                document: transformed,
                auditEntries,
                diagnostics
            } = processTemporalDocument(
                sourceDoc,
                definition,
                { resourceType: source.resource, model: source.model },
                definitions,
                {
                    mode: "write",
                    auditContext: {
                        ...context,
                        sourceDocument: sourceDoc,
                        sourceDocumentId: sourceDoc._id ?? sourceDoc.id
                    }
                }
            );

            const document = /** @type {object} */ (transformed);
            if (sourceDoc._id !== undefined) {
                document._id = sourceDoc._id;
            }
            if (sourceDoc.id !== undefined) {
                document.id = sourceDoc.id;
            }
            if (sourceDoc.meta?.versionId !== undefined) {
                document.meta = { ...(document.meta || {}), versionId: sourceDoc.meta.versionId };
            }

            return { document, auditEntries, diagnostics };
        } catch (error) {
            throw new DocumentTransformError(
                `Document transform failed at ${source.model}`,
                {
                    resource: source.resource,
                    model: source.model,
                    batchId: context.batchId,
                    sourceDocumentId: sourceDoc._id ?? sourceDoc.id,
                    path:
                        /** @type {{ path?: string }} */ (error).path ||
                        conversionContext?.path,
                    value:
                        /** @type {{ value?: unknown }} */ (error).value ??
                        conversionContext?.value,
                    category:
                        /** @type {{ category?: string }} */ (error).category ||
                        TEMPORAL_CATEGORIES.INVALID
                },
                error
            );
        }
    }

    /**
     * @param {object[]} documents
     * @param {import("./migrationContracts").MigrationTransformContext} context
     */
    function transformBatch(documents, context) {
        return documents.map((sourceDoc) => transformDocument(sourceDoc, context));
    }

    return {
        transformDocument,
        transformBatch
    };
}

/**
 * @param {object} _config
 * @returns {import("./migrationContracts").DocumentTransformer}
 */
function createStubDocumentTransformer(_config) {
    return {
        transformDocument() {
            throw new Error("Not implemented");
        }
    };
}

module.exports = {
    TRANSFORM_FAILED_CODE,
    DocumentTransformError,
    createDocumentTransformer,
    createStubDocumentTransformer
};
