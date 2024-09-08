const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ImmunizationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Immunization", paramsSearch);
};