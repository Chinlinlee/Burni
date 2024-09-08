const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../NamingSystemParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "NamingSystem", paramsSearch);
};