const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductAuthorizationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductAuthorization", paramsSearch);
};