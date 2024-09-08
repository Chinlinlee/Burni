const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ImmunizationEvaluationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ImmunizationEvaluation", paramsSearch);
};