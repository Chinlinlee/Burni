const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../OrganizationAffiliationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "OrganizationAffiliation", paramsSearch);
};