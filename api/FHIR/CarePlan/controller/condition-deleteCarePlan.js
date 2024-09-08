const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CarePlanParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CarePlan", paramsSearch);
};