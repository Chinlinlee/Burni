const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../LinkageParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Linkage", paramsSearch);
};