const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../VerificationResultParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "VerificationResult", paramsSearch);
};