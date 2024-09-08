const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicationRequest", paramsSearch);
};