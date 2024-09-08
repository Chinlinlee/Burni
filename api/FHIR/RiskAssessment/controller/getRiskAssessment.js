const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../RiskAssessmentParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "RiskAssessment", paramsSearch);
};