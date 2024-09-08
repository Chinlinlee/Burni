const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ImmunizationEvaluationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ImmunizationEvaluation", paramsSearch);
};