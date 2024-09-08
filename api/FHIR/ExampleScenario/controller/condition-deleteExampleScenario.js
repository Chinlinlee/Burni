const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../ExampleScenarioParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "ExampleScenario", paramsSearch);
};