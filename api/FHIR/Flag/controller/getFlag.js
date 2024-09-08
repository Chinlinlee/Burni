const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../FlagParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Flag", paramsSearch);
};