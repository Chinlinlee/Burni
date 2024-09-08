const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MessageDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MessageDefinition", paramsSearch);
};