const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EncounterParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Encounter", paramsSearch);
};