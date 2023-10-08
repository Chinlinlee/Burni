const history = require('../../../FHIRApiService/history');

module.exports = async function(req, res) {
    return await history(req, res, "Patient");
};