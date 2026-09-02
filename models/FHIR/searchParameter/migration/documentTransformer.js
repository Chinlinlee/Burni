const {
    mapTemporalDocument,
    loadDefinitions,
    TEMPORAL_CATEGORIES
} = require("./temporalPreflight");
const { convertLegacyTemporalValue } = require("./temporalConversion");
const {
    isCanonicalTemporalObject,
    toPlainCanonicalValue
} = require("../../temporal");

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
 * @param {unknown} originalValue
 * @param {string} category
 * @returns {string}
 */
function resolveConversionPolicy(originalValue, category) {
    if (category === TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE) {
        return "absolute-bson-date";
    }
    if (originalValue instanceof Date) {
        return "absolute-bson-date";
    }
    return "legacy-string";
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
        const { runIdentity, source } = context;
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

        /** @type {import("./migrationContracts").AuditRecord[]} */
        const auditEntries = [];
        /** @type {object[]} */
        const diagnostics = [];
        /** @type {{ value: unknown, type: string, path: string } | undefined} */
        let conversionContext;

        try {
            const document = /** @type {object} */ (
                mapTemporalDocument(
                    sourceDoc,
                    definition,
                    { resourceType: source.resource, model: source.model },
                    definitions,
                    (value, type, path) => {
                        const plain = toPlainCanonicalValue(value);
                        if (isCanonicalTemporalObject(plain, type)) {
                            return value;
                        }

                        conversionContext = { value, type, path };
                        const converted = convertLegacyTemporalValue(
                            value,
                            type,
                            path,
                            { resource: source.resource, model: source.model }
                        );
                        const category =
                            value instanceof Date
                                ? TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
                                : TEMPORAL_CATEGORIES.LEGACY_STRING;

                        auditEntries.push({
                            sourceDatabaseIdentity: runIdentity.sourceDatabaseIdentity,
                            sourceCollection: source.collectionName,
                            sourceDocumentId: sourceDoc._id ?? sourceDoc.id,
                            fhirPath: path,
                            temporalType: type,
                            policy: resolveConversionPolicy(value, category),
                            originalValue: value,
                            generatedValue: converted
                        });
                        diagnostics.push({
                            category,
                            temporalType: type,
                            resource: source.resource,
                            model: source.model,
                            path,
                            batchId: context.batchId
                        });
                        return converted;
                    }
                )
            );

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
