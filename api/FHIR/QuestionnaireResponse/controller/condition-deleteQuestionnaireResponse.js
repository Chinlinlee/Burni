const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../QuestionnaireResponseParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "QuestionnaireResponse", paramsSearch);
};