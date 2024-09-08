const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../RequestGroupParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "RequestGroup", paramsSearch);
};