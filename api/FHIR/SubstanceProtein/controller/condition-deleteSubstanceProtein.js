const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceProteinParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstanceProtein", paramsSearch);
};