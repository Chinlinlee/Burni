const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EnrollmentResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EnrollmentResponse", paramsSearch);
};