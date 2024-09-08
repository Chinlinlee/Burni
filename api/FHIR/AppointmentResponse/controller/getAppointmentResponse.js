const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AppointmentResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "AppointmentResponse", paramsSearch);
};