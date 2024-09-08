const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MessageDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MessageDefinition", paramsSearch);
};