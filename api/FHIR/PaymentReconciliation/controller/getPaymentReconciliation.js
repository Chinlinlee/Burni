const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PaymentReconciliationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "PaymentReconciliation", paramsSearch);
};