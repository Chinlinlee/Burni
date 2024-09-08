const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../OperationDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "OperationDefinition", paramsSearch);
};