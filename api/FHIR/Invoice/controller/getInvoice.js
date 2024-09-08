const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../InvoiceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Invoice", paramsSearch);
};