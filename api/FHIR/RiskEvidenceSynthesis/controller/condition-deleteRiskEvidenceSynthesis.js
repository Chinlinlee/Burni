const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../RiskEvidenceSynthesisParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "RiskEvidenceSynthesis", paramsSearch);
};