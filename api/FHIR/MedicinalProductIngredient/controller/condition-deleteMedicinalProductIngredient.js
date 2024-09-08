const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductIngredientParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductIngredient", paramsSearch);
};