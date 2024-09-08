const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ValueSetParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ValueSet", paramsSearch);
};