const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MeasureReportParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MeasureReport", paramsSearch);
};