const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EventDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EventDefinition", paramsSearch);
};