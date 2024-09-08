const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../RiskAssessmentParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "RiskAssessment", paramsSearch);
};