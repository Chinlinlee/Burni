const mongoose = require("mongoose");
const { createFakeRequest, createFakeResponse } = require("../fake-http");
const { ensureMongodbConnectorLoaded } = require("./fhir-service");

function loadPatientModel() {
    ensureMongodbConnectorLoaded();
    if (!mongoose.models.Patient) {
        throw new Error("MongoDB model not registered for Patient");
    }
}

async function clearPatientCollection() {
    loadPatientModel();
    await mongoose.model("Patient").deleteMany({});
}

/**
 * @param {Object} resource
 * @returns {Promise<Object>}
 */
async function createPatientViaService(resource) {
    loadPatientModel();
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body: resource, originalUrl: "/Patient" });
    const res = createFakeResponse();
    const service = new CreateService(req, res, "Patient");
    const { status, code, result } = await service.create();
    if (!status) {
        throw new Error(`Create failed (${code}): ${JSON.stringify(result)}`);
    }
    return result;
}

/**
 * @param {string} id
 */
async function readPatientViaService(id) {
    loadPatientModel();
    const { ReadService } = require("@root/api/FHIRApiService/services/read.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/Patient/${id}`
    });
    const res = createFakeResponse();
    const service = new ReadService(req, res, "Patient");
    return service.read();
}

/**
 * @param {Record<string, string>} query
 */
async function searchPatientViaService(query) {
    loadPatientModel();
    const { SearchService } = require("@root/api/FHIRApiService/services/search.service");
    const req = createFakeRequest({ query, originalUrl: "/Patient" });
    const res = createFakeResponse();
    const service = new SearchService(req, res, "Patient");
    return service.search();
}

/**
 * @param {Object} bundle
 * @returns {string[]}
 */
function getBundlePatientIds(bundle) {
    return (bundle.entry || [])
        .map((entry) => entry.resource?.id)
        .filter(Boolean);
}

module.exports = {
    clearPatientCollection,
    createPatientViaService,
    readPatientViaService,
    searchPatientViaService,
    getBundlePatientIds
};
