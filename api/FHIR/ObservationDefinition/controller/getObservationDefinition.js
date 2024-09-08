const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ObservationDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ObservationDefinition", paramsSearch);
};