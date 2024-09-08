const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ImmunizationRecommendationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ImmunizationRecommendation", paramsSearch);
};