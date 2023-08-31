const search = require("../../../FHIRApiService/search");
const { paramsSearch } = require("../PatientParametersHandler");
module.exports = async function (req, res) {
    return await search(req, res, "Patient", paramsSearch);
};
