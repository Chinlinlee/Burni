const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../OrganizationAffiliationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "OrganizationAffiliation", paramsSearch);
};