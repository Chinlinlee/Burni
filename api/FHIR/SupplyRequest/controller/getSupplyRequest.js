const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SupplyRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SupplyRequest", paramsSearch);
};