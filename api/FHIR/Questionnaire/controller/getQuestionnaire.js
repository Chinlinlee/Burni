const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../QuestionnaireParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Questionnaire", paramsSearch);
};