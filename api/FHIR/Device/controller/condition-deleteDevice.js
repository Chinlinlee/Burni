const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DeviceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Device", paramsSearch);
};