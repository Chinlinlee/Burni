const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ObservationDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ObservationDefinition", paramsSearch);
};