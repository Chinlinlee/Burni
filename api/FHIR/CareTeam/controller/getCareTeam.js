const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CareTeamParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CareTeam", paramsSearch);
};