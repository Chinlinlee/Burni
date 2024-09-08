const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SlotParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Slot", paramsSearch);
};