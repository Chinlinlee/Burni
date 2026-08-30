const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { createFakeRequest, createFakeResponse } = require("../fake-http");
const { loadResourceCatalog } = require("./resource-catalog");

/** @type {boolean} */
let mongodbConnectorLoaded = false;

function ensureMongodbConnectorLoaded() {
    if (mongodbConnectorLoaded) {
        return;
    }

    require("../../../models/mongodb/index.js");
    mongodbConnectorLoaded = true;
}

/**
 * @param {string} resourceType
 * @returns {string}
 */
function getResourceModelPath(resourceType) {
    return path.join(__dirname, "../../../models/mongodb/model", `${resourceType}.js`);
}

/**
 * @param {string} resourceType
 */
function ensureResourceModel(resourceType) {
    ensureMongodbConnectorLoaded();
    if (!mongoose.models[resourceType]) {
        throw new Error(`MongoDB model not registered for ${resourceType}`);
    }

    return mongoose.model(resourceType);
}

/**
 * @returns {{
 *   catalogCount: number,
 *   missingModelFiles: string[],
 *   registrationFailures: Array<{ resourceType: string, reason: string }>,
 *   valid: boolean
 * }}
 */
function diagnoseResourceModelRegistration() {
    const catalog = loadResourceCatalog();
    /** @type {string[]} */
    const missingModelFiles = [];
    /** @type {Array<{ resourceType: string, reason: string }>} */
    const registrationFailures = [];

    for (const resourceType of catalog) {
        const modelPath = getResourceModelPath(resourceType);
        if (!fs.existsSync(modelPath)) {
            missingModelFiles.push(resourceType);
        }
    }

    if (missingModelFiles.length > 0) {
        return {
            catalogCount: catalog.length,
            missingModelFiles,
            registrationFailures,
            valid: false
        };
    }

    ensureMongodbConnectorLoaded();

    for (const resourceType of catalog) {
        if (!mongoose.models[resourceType]) {
            registrationFailures.push({
                resourceType,
                reason: "model not registered after mongodb connector load"
            });
        }
    }

    return {
        catalogCount: catalog.length,
        missingModelFiles,
        registrationFailures,
        valid: registrationFailures.length === 0
    };
}

/**
 * @param {string} resourceType
 */
async function clearResourceCollection(resourceType) {
    const model = ensureResourceModel(resourceType);
    await model.deleteMany({});
}

/**
 * @param {string} resourceType
 * @param {Object} resource
 * @returns {Promise<Object>}
 */
async function createResourceViaService(resourceType, resource) {
    ensureResourceModel(resourceType);
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body: resource, originalUrl: `/${resourceType}` });
    const res = createFakeResponse();
    const service = new CreateService(req, res, resourceType);
    const { status, code, result } = await service.create();
    if (!status) {
        const detail =
            result instanceof Error
                ? `${result.name}: ${result.message}`
                : JSON.stringify(result, Object.getOwnPropertyNames(result));
        throw new Error(`Create failed for ${resourceType} (${code}): ${detail}`);
    }
    return result;
}

/**
 * @param {string} resourceType
 * @param {string} id
 */
async function readResourceViaService(resourceType, id) {
    ensureResourceModel(resourceType);
    const { ReadService } = require("@root/api/FHIRApiService/services/read.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/${resourceType}/${id}`
    });
    const res = createFakeResponse();
    const service = new ReadService(req, res, resourceType);
    const result = await service.read();
    if (!result.status) {
        throw new Error(
            `Read failed for ${resourceType}/${id} (${result.code}): ${JSON.stringify(result.result)}`
        );
    }
    return result;
}

module.exports = {
    clearResourceCollection,
    createResourceViaService,
    diagnoseResourceModelRegistration,
    ensureMongodbConnectorLoaded,
    ensureResourceModel,
    getResourceModelPath,
    readResourceViaService
};
