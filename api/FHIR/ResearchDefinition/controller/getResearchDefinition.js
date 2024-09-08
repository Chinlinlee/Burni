const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ResearchDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ResearchDefinition", paramsSearch);
};