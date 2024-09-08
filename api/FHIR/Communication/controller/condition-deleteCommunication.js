const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CommunicationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Communication", paramsSearch);
};