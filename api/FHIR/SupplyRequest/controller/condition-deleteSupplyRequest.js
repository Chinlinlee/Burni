const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SupplyRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SupplyRequest", paramsSearch);
};