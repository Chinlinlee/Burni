const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ProcedureParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Procedure", paramsSearch);
};