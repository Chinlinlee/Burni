const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../MedicinalProductPackagedParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "MedicinalProductPackaged", paramsSearch);
};