const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ResearchElementDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ResearchElementDefinition", paramsSearch);
};