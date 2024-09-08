const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DeviceUseStatementParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DeviceUseStatement", paramsSearch);
};