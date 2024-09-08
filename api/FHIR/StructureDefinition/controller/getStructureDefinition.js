const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../StructureDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "StructureDefinition", paramsSearch);
};