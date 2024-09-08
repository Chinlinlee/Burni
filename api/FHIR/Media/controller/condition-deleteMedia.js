const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MediaParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Media", paramsSearch);
};