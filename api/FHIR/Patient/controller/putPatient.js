const update = require('../../../FHIRApiService/update.js');

module.exports = async function(req, res) {
    return await update(req, res, "Patient");
};