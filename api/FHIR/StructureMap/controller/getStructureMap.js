const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../StructureMapParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "StructureMap", paramsSearch);
};