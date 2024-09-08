const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DeviceRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DeviceRequest", paramsSearch);
};