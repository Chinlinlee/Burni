const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PlanDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "PlanDefinition", paramsSearch);
};