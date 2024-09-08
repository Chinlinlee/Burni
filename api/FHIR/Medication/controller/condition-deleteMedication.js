const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Medication", paramsSearch);
};