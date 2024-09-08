const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CareTeamParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CareTeam", paramsSearch);
};