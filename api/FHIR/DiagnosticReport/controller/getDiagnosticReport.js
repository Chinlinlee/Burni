const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DiagnosticReportParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DiagnosticReport", paramsSearch);
};