const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const { loadFixtureProvenance } = require("@models/FHIR/searchParameter/migration/fixtureArchive");

/**
 * @typedef {Object} ActiveFixtureResult
 * @property {Object} resource
 * @property {string} resourceType
 * @property {string} valueSource
 * @property {string} activeFixturePath
 */

/**
 * @param {string} resourceType
 * @returns {ActiveFixtureResult}
 */
function loadActiveFixture(resourceType) {
    const provenanceByResource = loadFixtureProvenance();
    const provenance = provenanceByResource[resourceType];
    if (!provenance) {
        throw new Error(`Missing fixture provenance for ${resourceType}`);
    }
    if (!provenance.activeFixturePath) {
        throw new Error(
            `Missing active fixture path for ${resourceType} (valueSource=${provenance.valueSource})`
        );
    }

    const absolutePath = path.resolve(process.cwd(), provenance.activeFixturePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `Active fixture file not found for ${resourceType}: ${provenance.activeFixturePath}`
        );
    }

    const resource = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    if (resource.resourceType !== resourceType) {
        throw new Error(
            `Fixture resourceType mismatch for ${resourceType}: expected ${resourceType}, got ${resource.resourceType} (${provenance.activeFixturePath})`
        );
    }

    return {
        resource: _.cloneDeep(resource),
        resourceType,
        valueSource: provenance.valueSource,
        activeFixturePath: provenance.activeFixturePath
    };
}

/**
 * @param {Record<string, Object>} provenanceByResource
 * @param {string[]} catalog
 * @returns {{ missingInProvenance: string[], extraInProvenance: string[] }}
 */
function compareCatalogWithFixtureProvenance(provenanceByResource, catalog) {
    const catalogSet = new Set(catalog);
    const missingInProvenance = catalog.filter((resourceType) => !provenanceByResource[resourceType]);
    const extraInProvenance = Object.keys(provenanceByResource).filter(
        (resourceType) => !catalogSet.has(resourceType)
    );

    return { missingInProvenance, extraInProvenance };
}

module.exports = {
    loadActiveFixture,
    compareCatalogWithFixtureProvenance
};
