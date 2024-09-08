const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PractitionerParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Practitioner", paramsSearch);
};