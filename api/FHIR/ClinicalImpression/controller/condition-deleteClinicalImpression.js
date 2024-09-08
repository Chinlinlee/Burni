const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ClinicalImpressionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ClinicalImpression", paramsSearch);
};