const mongodb = require('../../models/mongodb');
const _ = require('lodash');

module.exports = async (resourceItem, index) => {
    try {
        let resourceType = _.get(resourceItem, "resourceType", false);
        if (!resourceType) {
            return {
                status: false,
                message: `Missing resourceType in contained[${index}]`
            };
        }
        if (mongodb[resourceType]) {
            let resourceToMongoModel = new mongodb[resourceType](resourceItem);
            await resourceToMongoModel.validate();
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
    } catch(e) {
        if (_.get(e,"errors")) {
            return {
                status: false,
                message: e.message
            };
        }
        return {
            status: false,
            message: e
        };
    }
};