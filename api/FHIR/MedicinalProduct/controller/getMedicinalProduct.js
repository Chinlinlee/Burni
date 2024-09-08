const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProduct", paramsSearch);
};