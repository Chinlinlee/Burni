const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../PractitionerRoleParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "PractitionerRole", paramsSearch);
};