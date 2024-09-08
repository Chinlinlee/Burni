const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SlotParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Slot", paramsSearch);
};