const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ClaimParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Claim", paramsSearch);
};