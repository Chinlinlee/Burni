const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../LocationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Location", paramsSearch);
};