const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../StructureDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "StructureDefinition", paramsSearch);
};