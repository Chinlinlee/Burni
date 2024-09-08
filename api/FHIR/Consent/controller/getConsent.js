const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ConsentParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Consent", paramsSearch);
};