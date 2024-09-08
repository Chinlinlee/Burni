const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../InsurancePlanParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "InsurancePlan", paramsSearch);
};