const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ResearchStudyParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ResearchStudy", paramsSearch);
};