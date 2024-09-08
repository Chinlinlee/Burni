const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ResearchDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ResearchDefinition", paramsSearch);
};