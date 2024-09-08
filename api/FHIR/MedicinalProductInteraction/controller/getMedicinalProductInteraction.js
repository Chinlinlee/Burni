const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductInteractionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductInteraction", paramsSearch);
};