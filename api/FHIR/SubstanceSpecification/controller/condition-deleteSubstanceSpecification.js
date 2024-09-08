const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceSpecificationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstanceSpecification", paramsSearch);
};