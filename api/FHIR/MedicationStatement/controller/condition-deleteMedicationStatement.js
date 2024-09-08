const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicationStatementParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicationStatement", paramsSearch);
};