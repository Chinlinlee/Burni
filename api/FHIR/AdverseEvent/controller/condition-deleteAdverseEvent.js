const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../AdverseEventParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "AdverseEvent", paramsSearch);
};