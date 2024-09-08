const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EndpointParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Endpoint", paramsSearch);
};