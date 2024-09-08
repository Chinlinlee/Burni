const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceSourceMaterialParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstanceSourceMaterial", paramsSearch);
};