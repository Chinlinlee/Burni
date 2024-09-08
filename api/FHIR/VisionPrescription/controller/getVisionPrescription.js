const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../VisionPrescriptionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "VisionPrescription", paramsSearch);
};