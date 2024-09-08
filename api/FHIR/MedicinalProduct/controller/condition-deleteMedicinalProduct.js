const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProduct", paramsSearch);
};