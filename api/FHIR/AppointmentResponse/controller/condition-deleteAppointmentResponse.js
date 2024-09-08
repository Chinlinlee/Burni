const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../AppointmentResponseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "AppointmentResponse", paramsSearch);
};