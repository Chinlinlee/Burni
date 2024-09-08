const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../GuidanceResponseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "GuidanceResponse", paramsSearch);
};