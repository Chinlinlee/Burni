const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubstanceReferenceInformationParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "SubstanceReferenceInformation", paramsSearch);
};