const productionResources = require("@models/FHIR/fhir.resourceList.json");

const EXPECTED_RESOURCE_COUNT = 146;

/**
 * @returns {string[]}
 */
function loadResourceCatalog() {
    if (!Array.isArray(productionResources)) {
        throw new Error("FHIR resource catalog must be an array");
    }
    if (productionResources.length !== EXPECTED_RESOURCE_COUNT) {
        throw new Error(
            `FHIR resource catalog must contain ${EXPECTED_RESOURCE_COUNT} resources, got ${productionResources.length}`
        );
    }

    const seen = new Set();
    for (const resourceType of productionResources) {
        if (typeof resourceType !== "string" || resourceType.length === 0) {
            throw new Error(`Invalid resource type in catalog: ${String(resourceType)}`);
        }
        if (seen.has(resourceType)) {
            throw new Error(`Duplicate resource type in catalog: ${resourceType}`);
        }
        seen.add(resourceType);
    }

    return [...productionResources];
}

module.exports = {
    EXPECTED_RESOURCE_COUNT,
    loadResourceCatalog
};
