const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstancePolymerParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstancePolymer", paramsSearch);
};