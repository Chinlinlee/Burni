const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicationKnowledgeParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicationKnowledge", paramsSearch);
};