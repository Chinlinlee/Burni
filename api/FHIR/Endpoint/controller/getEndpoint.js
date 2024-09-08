const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EndpointParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Endpoint", paramsSearch);
};