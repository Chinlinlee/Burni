const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CapabilityStatementParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CapabilityStatement", paramsSearch);
};