const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicationDispenseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicationDispense", paramsSearch);
};