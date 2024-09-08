const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DeviceDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DeviceDefinition", paramsSearch);
};