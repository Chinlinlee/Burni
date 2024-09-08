const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../NutritionOrderParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "NutritionOrder", paramsSearch);
};