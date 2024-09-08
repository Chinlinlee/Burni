const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicationKnowledgeParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicationKnowledge", paramsSearch);
};