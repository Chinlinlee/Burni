const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../GroupParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Group", paramsSearch);
};