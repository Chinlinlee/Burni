const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ProcedureParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Procedure", paramsSearch);
};