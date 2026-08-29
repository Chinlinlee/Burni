const { createDiagnostic } = require("./diagnostics");
const { getCanonicalKey, getLookupKeysForResource } = require("./identity");

const SUPPORTED_TYPES = new Set([
    "number",
    "date",
    "dateTime",
    "string",
    "token",
    "reference",
    "quantity",
    "uri",
    "composite",
    "special"
]);

const REQUIRED_FIELDS = ["resourceType", "code", "base", "type", "status"];

/**
 * @param {import('./types').SearchParameterResource} resource
 * @returns {{ valid: boolean, diagnostics: import('./diagnostics').RegistryDiagnostic[] }}
 */
function validateSearchParameterResource(resource) {
    /** @type {import('./diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    if (!resource || resource.resourceType !== "SearchParameter") {
        diagnostics.push(
            createDiagnostic({
                code: "invalid-resource-type",
                category: "validation",
                message: "Resource must be a FHIR SearchParameter"
            })
        );
        return { valid: false, diagnostics };
    }

    for (const field of REQUIRED_FIELDS) {
        if (resource[field] === undefined || resource[field] === null) {
            diagnostics.push(
                createDiagnostic({
                    code: "missing-required-field",
                    category: "validation",
                    message: `Missing required field: ${field}`,
                    canonicalKey: resource.url ? getCanonicalKey(resource) : undefined
                })
            );
        }
    }

    if (resource.base && (!Array.isArray(resource.base) || resource.base.length === 0)) {
        diagnostics.push(
            createDiagnostic({
                code: "invalid-base",
                category: "validation",
                message: "SearchParameter.base must be a non-empty array",
                canonicalKey: getCanonicalKey(resource)
            })
        );
    }

    if (resource.type && !SUPPORTED_TYPES.has(resource.type)) {
        diagnostics.push(
            createDiagnostic({
                code: "unsupported-type",
                category: "validation",
                message: `Unsupported SearchParameter type: ${resource.type}`,
                canonicalKey: getCanonicalKey(resource)
            })
        );
    }

    const lookupKeys = getLookupKeysForResource(resource);
    if (lookupKeys.length === 0 && resource.code && resource.base) {
        diagnostics.push(
            createDiagnostic({
                code: "invalid-lookup-key",
                category: "validation",
                message: "Unable to derive lookup keys from base and code",
                canonicalKey: getCanonicalKey(resource)
            })
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics
    };
}

module.exports = {
    SUPPORTED_TYPES,
    validateSearchParameterResource
};
