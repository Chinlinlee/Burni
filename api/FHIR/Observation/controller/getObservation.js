const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ObservationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Observation", paramsSearch);
};