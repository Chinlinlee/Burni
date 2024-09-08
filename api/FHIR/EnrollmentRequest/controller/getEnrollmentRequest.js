const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EnrollmentRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EnrollmentRequest", paramsSearch);
};