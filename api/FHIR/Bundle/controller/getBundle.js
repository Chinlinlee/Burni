const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../BundleParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Bundle", paramsSearch);
};