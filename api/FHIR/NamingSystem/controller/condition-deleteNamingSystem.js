const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../NamingSystemParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "NamingSystem", paramsSearch);
};