const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EnrollmentRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EnrollmentRequest", paramsSearch);
};