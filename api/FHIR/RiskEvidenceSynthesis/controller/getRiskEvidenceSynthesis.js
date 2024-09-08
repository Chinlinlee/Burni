const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../RiskEvidenceSynthesisParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "RiskEvidenceSynthesis", paramsSearch);
};