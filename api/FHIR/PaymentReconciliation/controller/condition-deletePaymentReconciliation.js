const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../PaymentReconciliationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "PaymentReconciliation", paramsSearch);
};