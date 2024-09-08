const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationAdministrationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicationAdministration", paramsSearch);
};