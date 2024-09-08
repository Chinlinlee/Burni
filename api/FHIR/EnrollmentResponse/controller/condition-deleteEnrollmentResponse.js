const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EnrollmentResponseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EnrollmentResponse", paramsSearch);
};