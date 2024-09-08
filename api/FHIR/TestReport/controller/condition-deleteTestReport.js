const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../TestReportParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "TestReport", paramsSearch);
};