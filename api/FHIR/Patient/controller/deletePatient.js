const deleteAPI = require("../../../FHIRApiService/delete");

module.exports = async function (req, res) {
    return await deleteAPI(req, res, "Patient");
};
