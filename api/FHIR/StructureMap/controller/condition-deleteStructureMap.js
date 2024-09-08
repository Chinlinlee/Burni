const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../StructureMapParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "StructureMap", paramsSearch);
};