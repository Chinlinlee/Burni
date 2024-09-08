const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EvidenceVariableParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EvidenceVariable", paramsSearch);
};