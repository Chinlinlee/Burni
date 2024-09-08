const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MessageHeaderParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MessageHeader", paramsSearch);
};