const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MediaParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Media", paramsSearch);
};