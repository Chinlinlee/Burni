const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductContraindicationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductContraindication", paramsSearch);
};