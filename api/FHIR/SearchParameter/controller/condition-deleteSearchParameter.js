const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SearchParameterParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SearchParameter", paramsSearch);
};