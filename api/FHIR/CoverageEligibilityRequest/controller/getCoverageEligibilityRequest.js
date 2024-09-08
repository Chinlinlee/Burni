const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CoverageEligibilityRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CoverageEligibilityRequest", paramsSearch);
};