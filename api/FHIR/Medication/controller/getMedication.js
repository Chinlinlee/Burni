const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Medication", paramsSearch);
};