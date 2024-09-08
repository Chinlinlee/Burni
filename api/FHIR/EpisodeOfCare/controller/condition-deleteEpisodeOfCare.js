const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../EpisodeOfCareParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "EpisodeOfCare", paramsSearch);
};