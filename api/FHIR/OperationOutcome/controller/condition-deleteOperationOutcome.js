const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../OperationOutcomeParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "OperationOutcome", paramsSearch);
};