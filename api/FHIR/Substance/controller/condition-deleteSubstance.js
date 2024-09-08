const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Substance", paramsSearch);
};