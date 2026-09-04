const mongoose = require("mongoose");
const uuid = require("uuid");
const { createFakeRequest, createFakeResponse } = require("../fake-http");
const { ensureMongodbConnectorLoaded } = require("./fhir-service");

function loadBundleModel() {
    ensureMongodbConnectorLoaded();
    if (!mongoose.models.Bundle) {
        throw new Error("MongoDB model not registered for Bundle");
    }
    return mongoose.model("Bundle");
}

/**
 * @param {string[]} resourceTypes
 */
async function clearCollections(resourceTypes) {
    ensureMongodbConnectorLoaded();
    for (const resourceType of resourceTypes) {
        if (!mongoose.models[resourceType]) {
            continue;
        }
        await mongoose.model(resourceType).deleteMany({});
    }
}

/**
 * @param {string} resourceType
 * @param {Object[]} documents
 * @returns {Promise<Object[]>}
 */
async function insertResources(resourceType, documents) {
    ensureMongodbConnectorLoaded();
    const model = mongoose.model(resourceType);
    /** @type {Object[]} */
    const stored = [];
    for (const document of documents) {
        const payload = { ...document };
        if (!payload.id) {
            payload.id = uuid.v4();
        }
        stored.push(await model.create(payload));
    }
    return stored;
}

/**
 * @param {Record<string, string>} query
 */
async function searchBundleViaService(query) {
    loadBundleModel();
    const { SearchService } = require("@root/api/FHIRApiService/services/search.service");
    const req = createFakeRequest({ query, originalUrl: "/Bundle" });
    const res = createFakeResponse();
    const service = new SearchService(req, res, "Bundle");
    return service.search();
}

/**
 * @param {string} resourceType
 * @param {Record<string, string>} query
 */
async function searchResourceViaService(resourceType, query) {
    ensureMongodbConnectorLoaded();
    const { SearchService } = require("@root/api/FHIRApiService/services/search.service");
    const req = createFakeRequest({ query, originalUrl: `/${resourceType}` });
    const res = createFakeResponse();
    const service = new SearchService(req, res, resourceType);
    return service.search();
}

/**
 * @param {Object} bundle
 * @returns {string[]}
 */
function getBundleResourceIds(bundle) {
    return (bundle.entry || [])
        .map((entry) => entry.resource?.id)
        .filter(Boolean);
}

/**
 * @param {Object} searchBundle
 * @returns {string[]}
 */
function getStoredBundleIds(searchBundle) {
    return (searchBundle.entry || [])
        .map((entry) => entry.resource?.id)
        .filter(Boolean);
}

module.exports = {
    clearCollections,
    getBundleResourceIds,
    getStoredBundleIds,
    insertResources,
    searchBundleViaService,
    searchResourceViaService
};
