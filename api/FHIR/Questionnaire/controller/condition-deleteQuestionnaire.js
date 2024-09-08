const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../QuestionnaireParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Questionnaire", paramsSearch);
};