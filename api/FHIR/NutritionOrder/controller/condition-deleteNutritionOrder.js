const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../NutritionOrderParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "NutritionOrder", paramsSearch);
};