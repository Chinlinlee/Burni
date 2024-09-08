const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SpecimenDefinitionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SpecimenDefinition", paramsSearch);
};