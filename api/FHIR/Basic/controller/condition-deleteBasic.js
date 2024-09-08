const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../BasicParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Basic", paramsSearch);
};