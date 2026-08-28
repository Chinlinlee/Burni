const {
    FhirValidationError,
    ErrorOperationOutcome
} = require("@models/FHIR/httpMessage");

/**
 * @param {{ status: boolean, code: number, result: Object }} validation
 */
function throwIfValidationFailed(validation) {
    if (validation.status) {
        return;
    }

    if (validation.code === 422) {
        throw new FhirValidationError(validation.result);
    }

    throw new ErrorOperationOutcome(validation.code, validation.result);
}

module.exports = {
    throwIfValidationFailed
};
