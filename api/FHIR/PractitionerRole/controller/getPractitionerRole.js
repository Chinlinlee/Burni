const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PractitionerRoleParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "PractitionerRole", paramsSearch);
};