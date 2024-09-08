const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EventDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EventDefinition", paramsSearch);
};