const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SpecimenDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SpecimenDefinition", paramsSearch);
};