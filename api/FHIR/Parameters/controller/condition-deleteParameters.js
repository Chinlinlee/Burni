const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ParametersParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Parameters", paramsSearch);
};