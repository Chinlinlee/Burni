const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ClinicalImpressionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ClinicalImpression", paramsSearch);
};