const validate = require('../../../FHIRApiService/$validate');

module.exports = async function(req, res) {
    return await validate(req, res, "Patient");
}