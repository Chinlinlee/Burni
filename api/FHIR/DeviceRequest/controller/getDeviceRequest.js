const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DeviceRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DeviceRequest", paramsSearch);
};