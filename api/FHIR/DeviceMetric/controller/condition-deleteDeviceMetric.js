const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DeviceMetricParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DeviceMetric", paramsSearch);
};