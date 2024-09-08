const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../TaskParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Task", paramsSearch);
};