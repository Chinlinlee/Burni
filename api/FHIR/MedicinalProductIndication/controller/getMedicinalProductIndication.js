const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductIndicationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductIndication", paramsSearch);
};