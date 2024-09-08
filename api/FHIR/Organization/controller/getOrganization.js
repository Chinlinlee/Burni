const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../OrganizationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Organization", paramsSearch);
};