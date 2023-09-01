const conditionDelete = require("../../../FHIRApiService/condition-delete");
const { paramsSearch } = require("../PatientParametersHandler");
module.exports = async function (req, res) {
    return await conditionDelete(req, res, "Patient", paramsSearch);
};
