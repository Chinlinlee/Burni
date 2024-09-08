const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../BinaryParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Binary", paramsSearch);
};