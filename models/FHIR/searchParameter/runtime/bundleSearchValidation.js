const { handleError, FhirWebServiceError } = require("@models/FHIR/httpMessage");
const { ensureRegistryLoaded } = require("../registry/registryManager");
const { isControlParameter } = require("./parameterName");
const { RelationLimitSearchParameterError } = require("./relationLimitErrors");
const {
    InvalidSearchParameterValueError,
    UnknownSearchParameterError,
    validateRegistrySearchParameter
} = require("./searchParameterValidation");

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

        const values = params.getAll(key);
        const rawValue = values.length > 1 ? values : values[0];

        try {
            validateRegistrySearchParameter(snapshot, resourceType, key, rawValue);
        } catch (error) {
            if (error instanceof RelationLimitSearchParameterError) {
                throw new FhirWebServiceError(400, error.message, handleError.processing);
            }
            if (error instanceof UnknownSearchParameterError) {
                throw new FhirWebServiceError(
                    400,
                    `Invalid URL in request ${requestUrl} (Unknown parameter: ${key})`,
                    handleError.processing
                );
            }
            if (error instanceof InvalidSearchParameterValueError) {
                throw new FhirWebServiceError(400, error.message, handleError.processing);
            }
            throw error;
        }
    }
}

module.exports = {
    validateBundleGetSearchParameters
};
