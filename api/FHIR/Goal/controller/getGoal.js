const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../GoalParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Goal", paramsSearch);
};