const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CommunicationRequestParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "CommunicationRequest", paramsSearch);
};