const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EvidenceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Evidence", paramsSearch);
};