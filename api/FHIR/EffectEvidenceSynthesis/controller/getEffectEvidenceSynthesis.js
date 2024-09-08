const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EffectEvidenceSynthesisParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EffectEvidenceSynthesis", paramsSearch);
};