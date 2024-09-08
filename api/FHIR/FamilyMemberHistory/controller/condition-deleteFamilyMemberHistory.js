const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../FamilyMemberHistoryParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "FamilyMemberHistory", paramsSearch);
};