const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductPharmaceuticalParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductPharmaceutical", paramsSearch);
};