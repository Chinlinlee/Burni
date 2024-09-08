const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MeasureParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Measure", paramsSearch);
};