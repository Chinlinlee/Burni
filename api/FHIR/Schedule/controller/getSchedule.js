const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ScheduleParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Schedule", paramsSearch);
};