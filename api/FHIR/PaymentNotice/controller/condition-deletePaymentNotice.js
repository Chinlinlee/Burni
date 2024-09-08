const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../PaymentNoticeParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "PaymentNotice", paramsSearch);
};