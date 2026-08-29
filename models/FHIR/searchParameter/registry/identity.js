const FHIR_VERSION = "4.0.1";

/**
 * @param {import('./types').SearchParameterResource} resource
 * @returns {string}
 */
function getCanonicalKey(resource) {
    const url = resource.url || "";
    const version = resource.version || FHIR_VERSION;
    return `${url}::${version}`;
}

/**
 * @param {string} resourceType
 * @param {string} code
 * @returns {string}
 */
function getLookupKey(resourceType, code) {
    return `${resourceType}::${code}`;
}

/**
 * @param {string} lookupKey
 * @returns {{ resourceType: string, code: string }}
 */
function parseLookupKey(lookupKey) {
    const separatorIndex = lookupKey.indexOf("::");
    return {
        resourceType: lookupKey.slice(0, separatorIndex),
        code: lookupKey.slice(separatorIndex + 2)
    };
}

/**
 * @param {import('./types').SearchParameterResource} resource
 * @returns {string[]}
 */
function getBaseResourceTypes(resource) {
    const bases = resource.base || [];
    return bases.map((base) => {
        if (base.startsWith("http://hl7.org/fhir/StructureDefinition/")) {
            const parts = base.split("/");
            return parts[parts.length - 1];
        }
        return base;
    });
}

/**
 * @param {import('./types').SearchParameterResource} resource
 * @returns {string[]}
 */
function getLookupKeysForResource(resource) {
    const code = resource.code;
    if (!code) {
        return [];
    }
    return getBaseResourceTypes(resource).map((resourceType) =>
        getLookupKey(resourceType, code)
    );
}

module.exports = {
    FHIR_VERSION,
    getCanonicalKey,
    getLookupKey,
    parseLookupKey,
    getBaseResourceTypes,
    getLookupKeysForResource
};
