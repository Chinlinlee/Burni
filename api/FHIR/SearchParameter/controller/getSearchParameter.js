const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SearchParameterParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SearchParameter", paramsSearch);
};