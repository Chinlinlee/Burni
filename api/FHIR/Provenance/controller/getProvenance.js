const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ProvenanceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Provenance", paramsSearch);
};