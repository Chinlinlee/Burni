const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../BinaryParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Binary", paramsSearch);
};