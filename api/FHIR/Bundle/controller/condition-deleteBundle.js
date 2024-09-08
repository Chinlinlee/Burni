const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../BundleParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Bundle", paramsSearch);
};