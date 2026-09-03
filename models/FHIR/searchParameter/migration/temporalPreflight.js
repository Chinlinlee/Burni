const {
    TEMPORAL_CATEGORIES,
    classifyTemporalValue,
    scanTemporalDocument,
    mapTemporalDocument,
    loadDefinitions
} = require("./temporalDocumentTransform");

/**
 * @param {object} model
 * @returns {Promise<unknown[]>}
 */
async function readModelDocuments(model) {
    if (!model || typeof model.find !== "function") {
        return [];
    }
    let query = model.find({});
    if (query && typeof query.lean === "function") {
        query = query.lean();
    }
    if (query && typeof query.exec === "function") {
        return query.exec();
    }
    if (query && typeof query.toArray === "function") {
        return query.toArray();
    }
    return Array.isArray(query) ? query : await query;
}

/**
 * @param {object | undefined} models
 * @param {string} modelName
 * @returns {object | undefined}
 */
function resolveModel(models, modelName) {
    if (
        models &&
        (typeof models[modelName] === "object" ||
            typeof models[modelName] === "function")
    ) {
        return models[modelName];
    }
    if (
        models &&
        models.models &&
        (typeof models.models[modelName] === "object" ||
            typeof models.models[modelName] === "function")
    ) {
        return models.models[modelName];
    }
    return undefined;
}

/**
 * @param {object} input
 * @param {object} [input.models]
 * @param {string[]} [input.catalog]
 * @param {Record<string, object>} [input.definitions]
 * @param {boolean} [input.includeHistory]
 * @returns {Promise<{
 *   readOnly: true,
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   sources: Array<object>,
 *   summary: Record<string, number>
 * }>}
 */
async function runTemporalMigrationPreflight({
    models = {},
    catalog = require("../../fhir.resourceList.json"),
    definitions = loadDefinitions(),
    includeHistory = true
}) {
    const diagnostics = [];
    const sources = [];
    let documentsScanned = 0;

    for (const resourceType of catalog) {
        const resourceModelName = resourceType;
        const resourceDefinition = definitions[resourceType];
        for (const source of [
            { modelName: resourceModelName, kind: "resource" },
            ...(includeHistory
                ? [{ modelName: `${resourceType}_history`, kind: "history" }]
                : [])
        ]) {
            const model = resolveModel(models, source.modelName);
            if (!model || !resourceDefinition) {
                const reason = !resourceDefinition
                    ? !model
                        ? "resource-definition-and-model-unavailable"
                        : "resource-definition-unavailable"
                    : "model-unavailable";
                const unavailableSource = {
                    resource: resourceType,
                    model: source.modelName,
                    kind: source.kind,
                    available: false,
                    documentCount: 0
                };
                sources.push({
                    ...unavailableSource
                });
                diagnostics.push({
                    code: "temporal-preflight-source-unavailable",
                    category: "unavailable-source",
                    unresolved: true,
                    message: `Temporal preflight source is unavailable: ${source.modelName}`,
                    reason,
                    ...unavailableSource
                });
                continue;
            }

            let documents;
            try {
                documents = await readModelDocuments(model);
            } catch (error) {
                const unavailableSource = {
                    resource: resourceType,
                    model: source.modelName,
                    kind: source.kind,
                    available: false,
                    documentCount: 0
                };
                sources.push(unavailableSource);
                diagnostics.push({
                    code: "temporal-preflight-source-unavailable",
                    category: "unavailable-source",
                    unresolved: true,
                    message:
                        error instanceof Error
                            ? error.message
                            : `Unable to read temporal preflight source: ${source.modelName}`,
                    reason: "source-read-failed",
                    ...unavailableSource
                });
                continue;
            }
            sources.push({
                resource: resourceType,
                model: source.modelName,
                kind: source.kind,
                available: true,
                documentCount: documents.length
            });
            for (let index = 0; index < documents.length; index++) {
                documentsScanned++;
                diagnostics.push(
                    ...scanTemporalDocument(
                        documents[index],
                        resourceDefinition,
                        {
                            resourceType,
                            model: source.modelName,
                            documentIndex: index
                        },
                        definitions
                    )
                );
            }
        }
    }

    const unavailableSources = sources.filter((source) => !source.available).length;
    const temporalDiagnostics = diagnostics.filter((diagnostic) =>
        Object.values(TEMPORAL_CATEGORIES).includes(diagnostic.category)
    );
    const lossyBsonDates = temporalDiagnostics.filter(
        (diagnostic) =>
            diagnostic.category === TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
    ).length;
    const unresolvedAmbiguousBsonDates = temporalDiagnostics.filter(
        (diagnostic) =>
            diagnostic.category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
    ).length;
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

module.exports = {
    TEMPORAL_CATEGORIES,
    classifyTemporalValue,
    scanTemporalDocument,
    mapTemporalDocument,
    loadDefinitions,
    readModelDocuments,
    resolveModel,
    runTemporalMigrationPreflight,
    runMigrationPreflight: runTemporalMigrationPreflight
};
