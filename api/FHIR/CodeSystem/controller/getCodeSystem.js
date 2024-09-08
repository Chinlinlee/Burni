const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CodeSystemParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CodeSystem", paramsSearch);
};