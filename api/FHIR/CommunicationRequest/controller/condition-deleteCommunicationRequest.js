const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../CommunicationRequestParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "CommunicationRequest", paramsSearch);
};