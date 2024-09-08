const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicationRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicationRequest", paramsSearch);
};