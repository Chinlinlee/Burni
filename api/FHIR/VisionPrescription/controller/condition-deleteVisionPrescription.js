const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../VisionPrescriptionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "VisionPrescription", paramsSearch);
};