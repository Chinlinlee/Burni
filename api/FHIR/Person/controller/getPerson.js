const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PersonParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Person", paramsSearch);
};