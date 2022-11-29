const mongodb = require('../../models/mongodb');
const _ = require('lodash');

async function validateContained(resourceItem, index) {
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
}

async function validateContainedList(data) {
    let cloneData = _.cloneDeep(data);
    if (_.get(cloneData, "contained")) {
        let containedResources = _.get(cloneData, "contained");
        for (let index in containedResources) {
            let resource = containedResources[index];
            let validation = await validateContained(resource, index);
            if (!validation.status) {
                return {
                    status: false,
                    message: validation.message
                };
            }
        }
    }
    return {
        status: true,
        message: "success"
    };
}

module.exports.validateContained = validateContained;
module.exports.validateContainedList = validateContainedList;