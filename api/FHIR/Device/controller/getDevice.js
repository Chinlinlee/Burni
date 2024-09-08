const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DeviceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Device", paramsSearch);
};