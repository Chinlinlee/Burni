const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../LinkageParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Linkage", paramsSearch);
};