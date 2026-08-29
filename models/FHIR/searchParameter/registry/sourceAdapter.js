const path = require("path");
const fs = require("fs");
const { createDiagnostic } = require("./diagnostics");
const { getCanonicalKey, getLookupKeysForResource } = require("./identity");
const { validateSearchParameterResource } = require("./validation");

const DEFAULT_BUNDLE_PATH = path.join(
    __dirname,
    "../fixtures/search-parameters-r4-4.0.1.json"
);

/**
 * @param {string} [bundlePath]
 * @returns {import('./types').SearchParameterResource[]}
 */
function loadBuiltinBundle(bundlePath = DEFAULT_BUNDLE_PATH) {
    const raw = fs.readFileSync(bundlePath, "utf8");
    const bundle = JSON.parse(raw);
    if (bundle.resourceType !== "Bundle" || !Array.isArray(bundle.entry)) {
        throw new Error("Invalid SearchParameter bundle fixture");
    }
    return bundle.entry
        .map((entry) => entry.resource)
        .filter((resource) => resource && resource.resourceType === "SearchParameter");
}

/**
 * @param {import('./types').SearchParameterResource} resource
 * @param {'builtin-bundle' | 'database'} source
 * @returns {{ definition: import('./types').SearchParameterDefinition | null, diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function parseSearchParameterResource(resource, source) {
    const validation = validateSearchParameterResource(resource);
    if (!validation.valid) {
        return {
            definition: null,
            diagnostics: validation.diagnostics.map((diagnostic) => ({
                ...diagnostic,
                source,
                rawStatus: resource.status
            }))
        };
    }

    const canonicalKey = getCanonicalKey(resource);
    const lookupKeys = getLookupKeysForResource(resource);

    return {
        definition: {
            resource,
            source,
            canonicalKey,
            lookupKeys,
            rawStatus: resource.status || "unknown",
            effectiveStatus: "disabled",
            diagnostics: []
        },
        diagnostics: []
    };
}

/**
 * @param {string} [bundlePath]
 * @returns {{ definitions: import('./types').SearchParameterDefinition[], diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function loadBuiltinDefinitions(bundlePath) {
    const resources = loadBuiltinBundle(bundlePath);
    /** @type {import('./types').SearchParameterDefinition[]} */
    const definitions = [];
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const resource of resources) {
        const parsed = parseSearchParameterResource(resource, "builtin-bundle");
        if (parsed.definition) {
            definitions.push(parsed.definition);
        }
        diagnostics.push(...parsed.diagnostics);
    }

    return { definitions, diagnostics };
}

/**
 * @param {import('./types').SearchParameterResource[]} resources
 * @returns {{ definitions: import('./types').SearchParameterDefinition[], diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function loadDatabaseDefinitions(resources) {
    /** @type {import('./types').SearchParameterDefinition[]} */
    const definitions = [];
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const resource of resources) {
        const parsed = parseSearchParameterResource(resource, "database");
        if (parsed.definition) {
            definitions.push(parsed.definition);
        }
        diagnostics.push(...parsed.diagnostics);
    }

    return { definitions, diagnostics };
}

/**
 * @returns {Promise<import('./types').SearchParameterResource[]>}
 */
async function fetchDatabaseSearchParameters() {
    const mongoose = require("mongoose");
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        return [];
    }
    if (!mongoose.models.SearchParameter) {
        return [];
    }
    const docs = await mongoose.model("SearchParameter").find({}).lean();
    return docs.map((doc) => {
        const resource = { ...doc };
        delete resource._id;
        delete resource.__v;
        return resource;
    });
}

module.exports = {
    DEFAULT_BUNDLE_PATH,
    loadBuiltinBundle,
    parseSearchParameterResource,
    loadBuiltinDefinitions,
    loadDatabaseDefinitions,
    fetchDatabaseSearchParameters
};
