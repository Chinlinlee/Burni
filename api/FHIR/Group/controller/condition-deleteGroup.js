const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../GroupParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Group", paramsSearch);
};