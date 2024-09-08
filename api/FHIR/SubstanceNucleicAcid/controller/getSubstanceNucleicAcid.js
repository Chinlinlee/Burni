const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceNucleicAcidParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstanceNucleicAcid", paramsSearch);
};