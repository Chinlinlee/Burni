const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductUndesirableEffectParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductUndesirableEffect", paramsSearch);
};