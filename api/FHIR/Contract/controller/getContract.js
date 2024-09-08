const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ContractParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Contract", paramsSearch);
};