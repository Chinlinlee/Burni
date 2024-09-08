const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../AppointmentParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Appointment", paramsSearch);
};