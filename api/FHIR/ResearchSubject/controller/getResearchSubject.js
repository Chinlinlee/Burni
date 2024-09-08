const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ResearchSubjectParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ResearchSubject", paramsSearch);
};