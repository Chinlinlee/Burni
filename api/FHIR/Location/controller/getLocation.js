const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../LocationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Location", paramsSearch);
};