const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../MedicinalProductPackagedParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "MedicinalProductPackaged", paramsSearch);
};