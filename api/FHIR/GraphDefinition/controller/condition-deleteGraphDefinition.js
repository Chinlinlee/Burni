const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../GraphDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "GraphDefinition", paramsSearch);
};