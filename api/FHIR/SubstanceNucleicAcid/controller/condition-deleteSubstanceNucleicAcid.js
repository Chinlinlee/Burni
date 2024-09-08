const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceNucleicAcidParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstanceNucleicAcid", paramsSearch);
};