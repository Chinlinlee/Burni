const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../TaskParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Task", paramsSearch);
};