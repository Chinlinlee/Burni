const conditionDelete = require('../../../FHIRApiService/condition-delete');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SupplyRequest");
};