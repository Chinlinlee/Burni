const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CoverageEligibilityResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CoverageEligibilityResponse", paramsSearch);
};