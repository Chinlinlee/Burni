const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductAuthorizationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductAuthorization", paramsSearch);
};