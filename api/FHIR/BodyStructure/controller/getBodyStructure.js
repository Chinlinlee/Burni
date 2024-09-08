const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../BodyStructureParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "BodyStructure", paramsSearch);
};