const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../BiologicallyDerivedProductParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "BiologicallyDerivedProduct", paramsSearch);
};