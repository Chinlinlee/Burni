const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../PlanDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "PlanDefinition", paramsSearch);
};