const update = require('../../../FHIRApiService/update.js');
const _ = require('lodash');
module.exports = async function(req, res) {
    let resourceData = req.body;
    if (_.isArray(resourceData.entry) && resourceData.entry.length > 0) {
        for (let index in resourceData.entry) {
            let entry = resourceData.entry[index];
            if (resourceData.mode != "changes") {
                delete entry.delete;
            } else if (resourceData.mode != "working") {
                delete entry.date;
            }
        }
    }
    return await update(req, res, "List");
};