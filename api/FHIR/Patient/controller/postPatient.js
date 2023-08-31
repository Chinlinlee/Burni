const create = require("../../../FHIRApiService/create");
module.exports = async function (req, res) {
    return await create(req, res, "Patient");
};
