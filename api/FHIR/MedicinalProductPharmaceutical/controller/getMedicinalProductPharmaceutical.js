const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductPharmaceuticalParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductPharmaceutical", paramsSearch);
};