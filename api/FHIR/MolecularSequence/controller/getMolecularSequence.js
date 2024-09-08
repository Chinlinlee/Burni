const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MolecularSequenceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MolecularSequence", paramsSearch);
};