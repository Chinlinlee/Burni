const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ImplementationGuideParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ImplementationGuide", paramsSearch);
};