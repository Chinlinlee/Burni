const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MolecularSequenceParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MolecularSequence", paramsSearch);
};