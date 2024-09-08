const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DeviceDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DeviceDefinition", paramsSearch);
};