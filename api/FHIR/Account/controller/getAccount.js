const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AccountParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Account", paramsSearch);
};