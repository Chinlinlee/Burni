const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ParametersParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Parameters", paramsSearch);
};