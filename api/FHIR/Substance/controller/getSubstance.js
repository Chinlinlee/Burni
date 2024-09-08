const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Substance", paramsSearch);
};