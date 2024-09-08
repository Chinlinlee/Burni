const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ExplanationOfBenefitParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ExplanationOfBenefit", paramsSearch);
};