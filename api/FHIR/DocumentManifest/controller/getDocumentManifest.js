const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DocumentManifestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DocumentManifest", paramsSearch);
};