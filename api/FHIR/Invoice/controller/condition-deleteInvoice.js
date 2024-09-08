const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../InvoiceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Invoice", paramsSearch);
};