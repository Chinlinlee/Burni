const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ConditionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Condition", paramsSearch);
};