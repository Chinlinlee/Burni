const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ChargeItemDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ChargeItemDefinition", paramsSearch);
};