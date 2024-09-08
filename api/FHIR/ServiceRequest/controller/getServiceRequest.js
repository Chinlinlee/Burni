const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ServiceRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ServiceRequest", paramsSearch);
};