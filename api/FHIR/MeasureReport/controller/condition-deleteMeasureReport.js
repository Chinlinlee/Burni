const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MeasureReportParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MeasureReport", paramsSearch);
};