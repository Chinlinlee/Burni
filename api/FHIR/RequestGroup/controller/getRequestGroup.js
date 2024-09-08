const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../RequestGroupParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "RequestGroup", paramsSearch);
};