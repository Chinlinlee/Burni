const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ServiceRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ServiceRequest", paramsSearch);
};