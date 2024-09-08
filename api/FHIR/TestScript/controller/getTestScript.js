const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../TestScriptParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "TestScript", paramsSearch);
};