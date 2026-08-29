const search = require('../../../FHIRApiService/search');
module.exports = async function(req, res) {
    return await search(req, res, "Task");
};