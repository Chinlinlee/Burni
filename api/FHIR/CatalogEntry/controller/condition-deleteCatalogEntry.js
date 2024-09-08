const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CatalogEntryParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CatalogEntry", paramsSearch);
};