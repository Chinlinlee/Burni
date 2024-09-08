const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ListParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "List", paramsSearch);
};