const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CoverageParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Coverage", paramsSearch);
};