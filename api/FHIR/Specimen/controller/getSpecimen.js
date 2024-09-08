const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SpecimenParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Specimen", paramsSearch);
};