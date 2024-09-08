const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../DocumentReferenceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "DocumentReference", paramsSearch);
};