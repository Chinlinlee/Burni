const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EncounterParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Encounter", paramsSearch);
};