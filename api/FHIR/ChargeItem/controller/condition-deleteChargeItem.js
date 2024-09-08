const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ChargeItemParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ChargeItem", paramsSearch);
};