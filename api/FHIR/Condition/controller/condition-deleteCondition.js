const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ConditionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Condition", paramsSearch);
};