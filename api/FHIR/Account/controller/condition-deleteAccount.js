const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../AccountParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Account", paramsSearch);
};