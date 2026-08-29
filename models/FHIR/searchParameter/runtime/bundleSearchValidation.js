const { handleError, FhirWebServiceError } = require("@models/FHIR/httpMessage");
const { ensureRegistryLoaded } = require("../registry/registryManager");
const { resolveLookupStatus, getEffectiveDefinition } = require("../registry/snapshot");
const { parseSearchParameterName, isControlParameter } = require("./parameterName");
const { buildRelationPlan } = require("../executor/relationPlan");

/**
 * @param {string} resourceType
 * @param {URLSearchParams} params
 * @param {string} requestUrl
 */
async function validateBundleGetSearchParameters(resourceType, params, requestUrl) {
    const snapshot = await ensureRegistryLoaded();
    for (const [key] of params) {
        if (isControlParameter(key)) {
            continue;
        }

        const parsed = parseSearchParameterName(key);
        const status = resolveLookupStatus(snapshot, resourceType, parsed.code);
        if (status !== "effective") {
            throw new FhirWebServiceError(
                400,
                `Invalid URL in request ${requestUrl} (Unknown parameter: ${key})`,
                handleError.processing
            );
        }

        if (!parsed.chain) {
            continue;
        }

        const definition = getEffectiveDefinition(snapshot, resourceType, parsed.code);
        if (!definition?.compiledPlan) {
            throw new FhirWebServiceError(
                400,
                `Invalid URL in request ${requestUrl} (Unknown parameter: ${key})`,
                handleError.processing
            );
        }
        const relation = buildRelationPlan(
            definition.compiledPlan,
            parsed.chain,
            snapshot,
            parsed.typeFilter
        );
        if (!relation.valid) {
            throw new FhirWebServiceError(
                400,
                `Invalid URL in request ${requestUrl} (Unknown parameter: ${key})`,
                handleError.processing
            );
        }
    }
}

module.exports = {
    validateBundleGetSearchParameters
};
