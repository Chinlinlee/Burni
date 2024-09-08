const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationStatementParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicationStatement", paramsSearch);
};