const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../TerminologyCapabilitiesParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "TerminologyCapabilities", paramsSearch);
};