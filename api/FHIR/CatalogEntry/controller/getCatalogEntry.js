const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CatalogEntryParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CatalogEntry", paramsSearch);
};