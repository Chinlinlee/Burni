const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {Record<string, string | undefined>} */
const originalEnv = {};

const REGISTRY_ENV = {
    ENABLE_VALIDATOR: "false"
};

const MODULES_TO_RELOAD = [
    "@models/FHIR/searchParameter/runtime/registrySearchHandler",
    "@models/FHIR/searchParameter/registry/registryManager"
];

function setRegistryTestEnv() {
    for (const [key, value] of Object.entries(REGISTRY_ENV)) {
        if (!(key in originalEnv)) {
            originalEnv[key] = process.env[key];
        }
        process.env[key] = value;
    }
    if (!("MONGODB_CONNECTION_URL" in originalEnv)) {
        originalEnv.MONGODB_CONNECTION_URL = process.env.MONGODB_CONNECTION_URL;
    }
}

function restoreEnv() {
    for (const key of Object.keys(REGISTRY_ENV)) {
        if (originalEnv[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = originalEnv[key];
        }
    }
    if (originalEnv.MONGODB_CONNECTION_URL === undefined) {
        delete process.env.MONGODB_CONNECTION_URL;
    } else {
        process.env.MONGODB_CONNECTION_URL = originalEnv.MONGODB_CONNECTION_URL;
    }
}

function clearModuleCache() {
    for (const mod of MODULES_TO_RELOAD) {
        try {
            delete require.cache[require.resolve(mod)];
        } catch {
            // module not loaded yet
        }
    }
}

function loadPatientModel() {
    if (!mongoose.models.Patient) {
        const patientModelPath = path.join(__dirname, "../../models/mongodb/model/Patient.js");
        require(patientModelPath)(mongoose);
    }
}

/**
 * @returns {Promise<{ mongoose: typeof mongoose, memoryServer: MongoMemoryServer }>}
 */
async function startMongoMemoryTestContext() {
    setRegistryTestEnv();
    clearModuleCache();

    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    process.env.MONGODB_CONNECTION_URL = uri;

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
    loadPatientModel();

    const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
    await reloadRegistry();

    return { mongoose, memoryServer };
}

async function stopMongoMemoryTestContext() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
    }
    restoreEnv();
    clearModuleCache();
}

async function clearPatientCollection() {
    if (mongoose.models.Patient) {
        await mongoose.model("Patient").deleteMany({});
    }
}

/**
 * @param {Object} [options]
 * @param {Object} [options.body]
 * @param {Object} [options.query]
 * @param {Object} [options.params]
 * @param {string} [options.originalUrl]
 * @param {Record<string, string>} [options.headers]
 */
function createFakeRequest(options = {}) {
    const headers = { accept: "application/fhir+json", ...(options.headers || {}) };
    const query = { ...(options.query || {}) };

    return {
        body: options.body,
        query,
        params: options.params || {},
        protocol: "http",
        originalUrl: options.originalUrl || "/Patient",
        url: options.url || "/Patient",
        headers,
        get(name) {
            const lower = name.toLowerCase();
            if (lower === "host") {
                return "localhost";
            }
            if (lower === "accept") {
                return headers.accept;
            }
            return headers[name] || headers[lower];
        }
    };
}

function createFakeResponse() {
    const state = {
        statusCode: 200,
        headers: { "content-type": "application/fhir+json" },
        body: null
    };

    return {
        locals: {},
        getHeader(name) {
            return state.headers[name.toLowerCase()] || state.headers[name];
        },
        setHeader(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        set(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        header(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        append(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        status(code) {
            state.statusCode = code;
            return this;
        },
        send(body) {
            state.body = body;
            return body;
        },
        getState() {
            return state;
        }
    };
}

/**
 * @param {Object} resource
 * @returns {Promise<Object>}
 */
async function createPatientViaService(resource) {
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
    startMongoMemoryTestContext,
    stopMongoMemoryTestContext,
    clearPatientCollection,
    createFakeRequest,
    createFakeResponse,
    createPatientViaService,
    readPatientViaService,
    searchPatientViaService,
    getBundlePatientIds
};
