const mongodb = require('../../models/mongodb');
const _ = require('lodash');

module.exports = (resourceItem, index) => {
    let resourceType = _.get(resourceItem, "resourceType", false);
    if (!resourceType) {
        return {
            status: false,
            message: `Missing resourceType in contained[${index}]`
        };
    }
    if (mongodb[resourceType]) {
        let resourceToMongoModel = new mongodb[resourceType](resourceItem);
        let validation = resourceToMongoModel.validateSync();
        if (_.get(validation,"errors")) {
            return {
                status: false,
                message: validation.message
            };
        }
        return {
            status: true,
            message: "success"
        };
    } else {
        return {
            status: false,
            message: `Burni not support this resource type. ${resourceType}`
        };
    }
};