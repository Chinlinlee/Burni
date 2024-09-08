const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../TerminologyCapabilitiesParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "TerminologyCapabilities", paramsSearch);
};