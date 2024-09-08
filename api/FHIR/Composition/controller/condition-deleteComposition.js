const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CompositionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Composition", paramsSearch);
};