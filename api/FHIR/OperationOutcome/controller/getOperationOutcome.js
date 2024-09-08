const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../OperationOutcomeParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "OperationOutcome", paramsSearch);
};