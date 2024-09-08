const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../BiologicallyDerivedProductParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "BiologicallyDerivedProduct", paramsSearch);
};