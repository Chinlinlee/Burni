const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../GuidanceResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "GuidanceResponse", paramsSearch);
};