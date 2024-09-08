const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DocumentManifestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DocumentManifest", paramsSearch);
};