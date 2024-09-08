const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../AllergyIntoleranceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "AllergyIntolerance", paramsSearch);
};