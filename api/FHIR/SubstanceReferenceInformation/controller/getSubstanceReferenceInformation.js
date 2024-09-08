const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubstanceReferenceInformationParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "SubstanceReferenceInformation", paramsSearch);
};