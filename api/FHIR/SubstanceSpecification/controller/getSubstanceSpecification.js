const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceSpecificationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstanceSpecification", paramsSearch);
};