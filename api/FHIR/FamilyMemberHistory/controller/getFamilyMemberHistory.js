const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../FamilyMemberHistoryParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "FamilyMemberHistory", paramsSearch);
};