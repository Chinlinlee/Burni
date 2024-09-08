const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ActivityDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ActivityDefinition", paramsSearch);
};