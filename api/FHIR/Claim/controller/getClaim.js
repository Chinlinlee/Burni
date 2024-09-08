const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ClaimParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Claim", paramsSearch);
};