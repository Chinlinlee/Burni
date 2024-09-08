const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MeasureParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Measure", paramsSearch);
};