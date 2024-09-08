const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EvidenceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Evidence", paramsSearch);
};