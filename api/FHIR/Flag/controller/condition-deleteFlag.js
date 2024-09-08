const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../FlagParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Flag", paramsSearch);
};