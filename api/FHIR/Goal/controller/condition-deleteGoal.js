const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../GoalParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Goal", paramsSearch);
};