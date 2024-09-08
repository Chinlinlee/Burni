const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AuditEventParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "AuditEvent", paramsSearch);
};