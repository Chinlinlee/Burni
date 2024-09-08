const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CompositionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Composition", paramsSearch);
};