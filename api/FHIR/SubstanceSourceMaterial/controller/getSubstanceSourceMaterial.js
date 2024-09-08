const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceSourceMaterialParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstanceSourceMaterial", paramsSearch);
};