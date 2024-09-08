const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CoverageEligibilityRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CoverageEligibilityRequest", paramsSearch);
};