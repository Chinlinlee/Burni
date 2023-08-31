const read = require("../../../FHIRApiService/read");

module.exports = async function (req, res) {
    return await read(req, res, "Patient");
};
