const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../PaymentNoticeParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "PaymentNotice", paramsSearch);
};