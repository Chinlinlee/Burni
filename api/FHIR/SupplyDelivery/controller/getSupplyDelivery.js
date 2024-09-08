const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SupplyDeliveryParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SupplyDelivery", paramsSearch);
};