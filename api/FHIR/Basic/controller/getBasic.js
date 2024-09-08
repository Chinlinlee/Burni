const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../BasicParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Basic", paramsSearch);
};