const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ConceptMapParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ConceptMap", paramsSearch);
};