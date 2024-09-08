const conditionDelete = require('../../../FHIRApiService/condition-delete');
const {
    paramsSearch
} = require('../SubscriptionParametersHandler');
module.exports = async function(req, res) {
    return await conditionDelete(req, res, "Subscription", paramsSearch);
};