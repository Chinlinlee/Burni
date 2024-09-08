const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../PersonParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Person", paramsSearch);
};