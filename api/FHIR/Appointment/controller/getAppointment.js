const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AppointmentParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Appointment", paramsSearch);
};