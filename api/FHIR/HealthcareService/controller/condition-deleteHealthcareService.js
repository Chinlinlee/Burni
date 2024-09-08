const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../HealthcareServiceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "HealthcareService", paramsSearch);
};