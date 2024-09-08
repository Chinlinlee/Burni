const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceProteinParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstanceProtein", paramsSearch);
};