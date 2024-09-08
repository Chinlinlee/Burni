const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../RelatedPersonParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "RelatedPerson", paramsSearch);
};