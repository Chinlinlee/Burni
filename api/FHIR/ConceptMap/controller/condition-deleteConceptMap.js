const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ConceptMapParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ConceptMap", paramsSearch);
};