const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductInteractionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductInteraction", paramsSearch);
};