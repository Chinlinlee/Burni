const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CoverageEligibilityResponseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CoverageEligibilityResponse", paramsSearch);
};