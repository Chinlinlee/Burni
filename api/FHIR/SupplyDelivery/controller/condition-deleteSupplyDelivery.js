const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SupplyDeliveryParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SupplyDelivery", paramsSearch);
};