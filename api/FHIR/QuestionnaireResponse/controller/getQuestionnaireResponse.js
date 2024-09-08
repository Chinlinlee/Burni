const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../QuestionnaireResponseParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "QuestionnaireResponse", paramsSearch);
};