const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DeviceUseStatementParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DeviceUseStatement", paramsSearch);
};