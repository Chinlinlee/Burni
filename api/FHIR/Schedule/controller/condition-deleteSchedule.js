const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ScheduleParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Schedule", paramsSearch);
};