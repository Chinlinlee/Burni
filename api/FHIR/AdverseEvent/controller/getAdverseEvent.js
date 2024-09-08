const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AdverseEventParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "AdverseEvent", paramsSearch);
};