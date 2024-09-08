const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EvidenceVariableParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EvidenceVariable", paramsSearch);
};