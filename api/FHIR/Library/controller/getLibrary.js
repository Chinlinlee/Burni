const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../LibraryParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Library", paramsSearch);
};