const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ConsentParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Consent", paramsSearch);
};