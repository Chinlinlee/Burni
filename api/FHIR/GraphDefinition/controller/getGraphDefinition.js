const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../GraphDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "GraphDefinition", paramsSearch);
};