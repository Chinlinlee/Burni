const jp = require("jsonpath");
const mongoose = require("mongoose");

/**
 * Store the resource reference by which resources
 * e.g.
 * {
 *     resourceType: "Organization",
 *     id: "123",
 *     refBy: [
 *         {
 *             resourceType: "Patient",
 *             id:
 *         }
 *     ]
 * }
 * @param {Object} resource
 */
async function storeResourceRefBy(resource) {
    let referenceInItem = jp.nodes(resource, "$..reference");
    for (let refNode of referenceInItem) {
        let referenceSplit = refNode.value.split("/");
        let id = referenceSplit[referenceSplit.length - 1];
        let resourceType = referenceSplit[referenceSplit.length - 2];

        await mongoose.model("resourceRefBy").findOneAndUpdate(
            {
                $and: [
                    {
                        resourceType: resourceType
                    },
                    {
                        id: id
                    }
                ]
            },
            {
                $set: {
                    resourceType: resourceType,
                    id: id
                },
                $addToSet: {
                    refBy: {
                        resourceType: resource.resourceType,
                        id: resource.id
                    }
                }
            },
            {
                upsert: true
            }
        );
    }
}

/**
 * If resource not reference by any resource, delete this resource info in any refBy array
 * > Use in post delete
 * @param {Object} resource
 */
async function updateRefBy(resource) {
    try {
        await mongoose.model("resourceRefBy").updateMany(
            {
                $and: [
                    {
                        "refBy.resourceType": resource.resourceType
                    },
                    {
                        "refBy.id": resource.id
                    }
                ]
            },
            {
                $pull: {
                    refBy: {
                        resourceType: resource.resourceType,
                        id: resource.id
                    }
                }
            }
        );
    } catch (e) {
        throw e;
    }
}

/**
 * After updating refBy, some array will be empty that mean the resource is not referenced by any resource anymore.
 * So, we need to delete document that have empty refBy array.
 */
async function deleteEmptyRefBy() {
    try {
        await mongoose.model("resourceRefBy").deleteMany({
            $and: [
                {
                    refBy: {
                        $exists: true
                    }
                },
                {
                    refBy: {
                        $size: 0
                    }
                }
            ]
        });
    } catch (e) {
        throw e;
    }
}

/**
 * We must check the resource is referenced by any resources when fire deleting.
 * 1. If resource has referenced by any resource, throw error
 * 2. Do next process otherwise.
 * > Use in pre delete
 */
async function checkResourceHaveReferenceByOthers(resource) {
    try {
        let data = await mongoose
            .model("resourceRefBy")
            .countDocuments({
                $and: [
                    {
                        resourceType: resource.resourceType,
                        id: resource.id
                    }
                ]
            })
            .limit(1);

        if (data > 0) {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

module.exports.storeResourceRefBy = storeResourceRefBy;
module.exports.updateRefBy = updateRefBy;
module.exports.deleteEmptyRefBy = deleteEmptyRefBy;
module.exports.checkResourceHaveReferenceByOthers =
    checkResourceHaveReferenceByOthers;
