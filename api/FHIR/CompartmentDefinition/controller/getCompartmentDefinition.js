const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CompartmentDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CompartmentDefinition", paramsSearch);
};