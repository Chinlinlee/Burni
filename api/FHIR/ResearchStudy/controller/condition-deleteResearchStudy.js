const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ResearchStudyParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ResearchStudy", paramsSearch);
};