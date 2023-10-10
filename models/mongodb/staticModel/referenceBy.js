const instant = require("../FHIRDataTypesSchema/instant");

/**
 * The schema to storing each resource is refer by which resources
 * 1. Update data when update or create resource
 * 2. Check resource is exist in this data to prevent delete the resource refer by another resources
 * @Author Chin-Lin Lee <a5566qq2581@gmail.com>
 */

/**
 *
 * @param {import("mongoose")} mongodb
 * @returns
 */
module.exports = function (mongodb) {
    let basicInfo = new mongodb.Schema(
        {
            resourceType: {
                type: String,
                required: true,
                default: void 0
            },
            id: {
                type: String,
                required: true,
                default: void 0
            }
        },
        {
            _id: false,
            id: false
        }
    );

    let resourceRefBy = new mongodb.Schema(
        {},
        {
            versionKey: false
        }
    );

    resourceRefBy.add(basicInfo);
    resourceRefBy.add({
        lastUpdated: {
            ...instant,
            default: Date.now()
        }
    });
    resourceRefBy.add(
        new mongodb.Schema(
            {
                refBy: {
                    type: [basicInfo],
                    default: void 0
                }
            },
            {
                _id: false,
                id: false
            }
        )
    );

    resourceRefBy.index(
        {
            id: 1,
            resourceType: 1
        },
        {
            background: true
        }
    );

    resourceRefBy.index(
        {
            "refBy.id": 1,
            "refBy.resourceType": 1
        },
        {
            background: true
        }
    );

    let resourceRefByModel = mongodb.model(
        "resourceRefBy",
        resourceRefBy,
        "resourceRefBy"
    );
    return resourceRefByModel;
};
