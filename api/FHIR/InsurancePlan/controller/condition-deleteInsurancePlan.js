const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../InsurancePlanParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "InsurancePlan", paramsSearch);
};