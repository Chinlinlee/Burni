const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DiagnosticReportParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DiagnosticReport", paramsSearch);
};