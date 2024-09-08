const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ObservationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Observation", paramsSearch);
};