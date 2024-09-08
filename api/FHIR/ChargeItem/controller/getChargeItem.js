const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ChargeItemParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ChargeItem", paramsSearch);
};