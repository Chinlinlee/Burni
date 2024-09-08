const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ExampleScenarioParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ExampleScenario", paramsSearch);
};