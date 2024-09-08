const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../CommunicationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Communication", paramsSearch);
};