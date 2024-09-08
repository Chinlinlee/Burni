const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../ImagingStudyParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "ImagingStudy", paramsSearch);
};