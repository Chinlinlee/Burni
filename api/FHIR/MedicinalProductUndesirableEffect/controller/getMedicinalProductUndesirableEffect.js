const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductUndesirableEffectParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductUndesirableEffect", paramsSearch);
};