const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductManufacturedParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductManufactured", paramsSearch);
};