const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CarePlanParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CarePlan", paramsSearch);
};