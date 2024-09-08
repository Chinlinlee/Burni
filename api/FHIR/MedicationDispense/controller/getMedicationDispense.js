const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationDispenseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicationDispense", paramsSearch);
};