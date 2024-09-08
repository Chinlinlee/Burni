const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ResearchSubjectParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ResearchSubject", paramsSearch);
};