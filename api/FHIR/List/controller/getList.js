const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ListParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "List", paramsSearch);
};