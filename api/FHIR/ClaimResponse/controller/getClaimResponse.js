const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ClaimResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ClaimResponse", paramsSearch);
};