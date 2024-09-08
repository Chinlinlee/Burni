const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ChargeItemDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ChargeItemDefinition", paramsSearch);
};