const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../TestScriptParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "TestScript", paramsSearch);
};