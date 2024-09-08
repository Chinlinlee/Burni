const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SpecimenParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Specimen", paramsSearch);
};