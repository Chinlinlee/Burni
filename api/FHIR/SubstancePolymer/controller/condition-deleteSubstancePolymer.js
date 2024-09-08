const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstancePolymerParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstancePolymer", paramsSearch);
};