const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DeviceMetricParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DeviceMetric", paramsSearch);
};