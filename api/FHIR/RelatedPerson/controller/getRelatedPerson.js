const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../RelatedPersonParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "RelatedPerson", paramsSearch);
};