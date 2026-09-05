"use strict";

const productionResources = require("../../FHIR/fhir.resourceList.json");
const { discoverModelFiles } = require("../connector");
const { createCollectionContract, MODEL_KINDS } = require("./contracts");

const EXPECTED_RESOURCE_COUNT = 146;

const STATIC_COLLECTION_BY_MODEL_NAME = Object.freeze({
    referenceBy: "resourceRefBy"
});

/**
 * @param {string} file
 * @returns {string}
 */
function resourceTypeFromResourceFile(file) {
    return file.replace(/\.js$/, "");
}

/**
 * @param {string} file
 * @returns {string}
 */
function resourceTypeFromHistoryFile(file) {
    return file.replace(/_history\.js$/, "");
}

/**
 * @param {ReturnType<typeof discoverModelFiles>} discovered
 * @param {string[]} resourceCatalog
 * @returns {{ missingInCatalog: string[], extraInCatalog: string[], missingHistory: string[], extraHistory: string[] }}
 */
function compareDiscoveredWithCatalog(discovered, resourceCatalog) {
    const catalogSet = new Set(resourceCatalog);
    const resourceTypes = discovered.resourceModels.map(resourceTypeFromResourceFile);
    const historyTypes = discovered.historyModels.map(resourceTypeFromHistoryFile);
    const resourceSet = new Set(resourceTypes);
    const historySet = new Set(historyTypes);

    const missingInCatalog = resourceTypes.filter((resourceType) => !catalogSet.has(resourceType));
    const extraInCatalog = resourceCatalog.filter((resourceType) => !resourceSet.has(resourceType));
    const missingHistory = resourceCatalog.filter((resourceType) => !historySet.has(resourceType));
    const extraHistory = historyTypes.filter((resourceType) => !catalogSet.has(resourceType));

    return {
        missingInCatalog,
        extraInCatalog,
        missingHistory,
        extraHistory
    };
}

/**
 * @param {ReturnType<typeof discoverModelFiles>} discovered
 * @param {string[]} resourceCatalog
 */
function assertCatalogAlignment(discovered, resourceCatalog) {
    if (!Array.isArray(resourceCatalog)) {
        throw new Error("FHIR resource catalog must be an array");
    }
    if (resourceCatalog.length !== EXPECTED_RESOURCE_COUNT) {
        throw new Error(
            `FHIR resource catalog must contain ${EXPECTED_RESOURCE_COUNT} resources, got ${resourceCatalog.length}`
        );
    }

    const seen = new Set();
    for (const resourceType of resourceCatalog) {
        if (typeof resourceType !== "string" || resourceType.length === 0) {
            throw new Error(`Invalid resource type in catalog: ${String(resourceType)}`);
        }
        if (seen.has(resourceType)) {
            throw new Error(`Duplicate resource type in catalog: ${resourceType}`);
        }
        seen.add(resourceType);
    }

    if (discovered.resourceModels.length !== EXPECTED_RESOURCE_COUNT) {
        throw new Error(
            `Resource model files must contain ${EXPECTED_RESOURCE_COUNT} entries, got ${discovered.resourceModels.length}`
        );
    }
    if (discovered.historyModels.length !== EXPECTED_RESOURCE_COUNT) {
        throw new Error(
            `History model files must contain ${EXPECTED_RESOURCE_COUNT} entries, got ${discovered.historyModels.length}`
        );
    }

    const comparison = compareDiscoveredWithCatalog(discovered, resourceCatalog);
    if (comparison.missingInCatalog.length > 0) {
        throw new Error(
            `Resource models missing from catalog: ${comparison.missingInCatalog.join(", ")}`
        );
    }
    if (comparison.extraInCatalog.length > 0) {
        throw new Error(
            `Catalog resources missing model files: ${comparison.extraInCatalog.join(", ")}`
        );
    }
    if (comparison.missingHistory.length > 0) {
        throw new Error(
            `History models missing for catalog resources: ${comparison.missingHistory.join(", ")}`
        );
    }
    if (comparison.extraHistory.length > 0) {
        throw new Error(
            `History models exist outside catalog: ${comparison.extraHistory.join(", ")}`
        );
    }
}

/**
 * @param {ReturnType<typeof discoverModelFiles>} discovered
 * @param {string[]} resourceCatalog
 */
function assertPartialCatalogAlignment(discovered, resourceCatalog) {
    const catalogSet = new Set(resourceCatalog);
    const comparison = compareDiscoveredWithCatalog(discovered, resourceCatalog);

    if (discovered.resourceModels.length !== resourceCatalog.length) {
        throw new Error(
            `Resource model files must match catalog size ${resourceCatalog.length}, got ${discovered.resourceModels.length}`
        );
    }
    if (discovered.historyModels.length !== resourceCatalog.length) {
        throw new Error(
            `History model files must match catalog size ${resourceCatalog.length}, got ${discovered.historyModels.length}`
        );
    }
    if (comparison.missingInCatalog.length > 0 || comparison.extraInCatalog.length > 0) {
        throw new Error("Partial catalog discovery does not match resource catalog");
    }
    if (comparison.missingHistory.length > 0 || comparison.extraHistory.length > 0) {
        throw new Error("Partial catalog discovery does not match history models");
    }

    for (const resourceType of resourceCatalog) {
        if (!catalogSet.has(resourceType)) {
            throw new Error(`Invalid resource type in partial catalog: ${resourceType}`);
        }
    }
}

/**
 * @param {Object} [options]
 * @param {string[]} [options.resourceCatalog]
 * @param {ReturnType<typeof discoverModelFiles>} [options.discovered]
 * @param {boolean} [options.strictAlignment]
 * @returns {import('./types').ModelCatalog}
 */
function buildModelCatalog(options = {}) {
    const resourceCatalog = options.resourceCatalog || productionResources;
    const discovered = options.discovered || discoverModelFiles();
    const strictAlignment =
        options.strictAlignment ??
        (resourceCatalog.length === EXPECTED_RESOURCE_COUNT &&
            discovered.resourceModels.length === EXPECTED_RESOURCE_COUNT);

    if (strictAlignment) {
        assertCatalogAlignment(discovered, resourceCatalog);
    } else {
        assertPartialCatalogAlignment(discovered, resourceCatalog);
    }

    /** @type {import('./types').CollectionContract[]} */
    const entries = [];

    for (const file of discovered.resourceModels) {
        const resourceType = resourceTypeFromResourceFile(file);
        entries.push(
            createCollectionContract({
                collection: resourceType,
                modelName: resourceType,
                modelKind: MODEL_KINDS.RESOURCE,
                resourceType
            })
        );
    }

    for (const file of discovered.historyModels) {
        const resourceType = resourceTypeFromHistoryFile(file);
        const modelName = `${resourceType}_history`;
        entries.push(
            createCollectionContract({
                collection: modelName,
                modelName,
                modelKind: MODEL_KINDS.HISTORY,
                resourceType
            })
        );
    }

    for (const file of discovered.staticModels) {
        const modelName = resourceTypeFromResourceFile(file);
        const collection = STATIC_COLLECTION_BY_MODEL_NAME[modelName] || modelName;
        entries.push(
            createCollectionContract({
                collection,
                modelName,
                modelKind: MODEL_KINDS.STATIC
            })
        );
    }

    entries.sort((left, right) => left.collection.localeCompare(right.collection));

    return {
        resourceCount: discovered.resourceModels.length,
        historyCount: discovered.historyModels.length,
        staticCount: discovered.staticModels.length,
        collectionCount: entries.length,
        entries
    };
}

module.exports = {
    EXPECTED_RESOURCE_COUNT,
    compareDiscoveredWithCatalog,
    assertCatalogAlignment,
    assertPartialCatalogAlignment,
    buildModelCatalog
};
