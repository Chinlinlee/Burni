const vread = require('../../../FHIRApiService/vread');

module.exports = async function(req, res) {
    return await vread(req, res, "Patient");
};