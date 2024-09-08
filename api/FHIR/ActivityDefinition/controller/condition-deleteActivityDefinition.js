const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ActivityDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ActivityDefinition", paramsSearch);
};