const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductIngredientParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductIngredient", paramsSearch);
};