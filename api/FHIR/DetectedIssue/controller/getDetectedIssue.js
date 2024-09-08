const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../DetectedIssueParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "DetectedIssue", paramsSearch);
};