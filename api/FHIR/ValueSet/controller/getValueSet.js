const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ValueSetParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ValueSet", paramsSearch);
};