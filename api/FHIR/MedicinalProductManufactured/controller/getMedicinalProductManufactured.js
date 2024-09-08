const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductManufacturedParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductManufactured", paramsSearch);
};