const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ExplanationOfBenefitParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ExplanationOfBenefit", paramsSearch);
};