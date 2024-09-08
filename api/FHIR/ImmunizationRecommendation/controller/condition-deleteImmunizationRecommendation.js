const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ImmunizationRecommendationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ImmunizationRecommendation", paramsSearch);
};