const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../EpisodeOfCareParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "EpisodeOfCare", paramsSearch);
};