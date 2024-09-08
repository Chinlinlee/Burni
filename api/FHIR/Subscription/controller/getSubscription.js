const search = require('../../../FHIRApiService/search');
const {
    paramsSearch
} = require('../SubscriptionParametersHandler');
module.exports = async function(req, res) {
    return await search(req, res, "Subscription", paramsSearch);
};