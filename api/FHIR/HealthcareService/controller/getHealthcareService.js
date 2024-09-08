const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../HealthcareServiceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "HealthcareService", paramsSearch);
};