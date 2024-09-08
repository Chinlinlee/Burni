const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../TestReportParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "TestReport", paramsSearch);
};