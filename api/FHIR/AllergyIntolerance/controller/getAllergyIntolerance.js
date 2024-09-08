const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../AllergyIntoleranceParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "AllergyIntolerance", paramsSearch);
};