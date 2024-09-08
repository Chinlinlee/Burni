const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EffectEvidenceSynthesisParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EffectEvidenceSynthesis", paramsSearch);
};