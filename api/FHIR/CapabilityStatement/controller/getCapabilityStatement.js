const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CapabilityStatementParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CapabilityStatement", paramsSearch);
};