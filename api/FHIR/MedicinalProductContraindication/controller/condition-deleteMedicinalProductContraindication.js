const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductContraindicationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductContraindication", paramsSearch);
};