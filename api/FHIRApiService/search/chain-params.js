const _ = require("lodash");
const resourceIncludeRef = require("../../../api_generator/resource-reference/resourceInclude.json");
const { findParamType, isResourceType } = require("../../../utils/fhir-param");
const uuid = require("uuid");

/**
 *
 * @param {string[]} chainParamList
 * @param {Object[]} chainRefResourceList
 * @returns
 */
function getChainParent(chainParamList, chainRefResourceList) {
    for (let i = 0; i < chainParamList.length; i++) {
        let chainParam = chainParamList[i];
        let [chianParamName, chainResourceType] = chainParam.split(":");
        let currentRefResourceList = _.last(chainRefResourceList);
        let removeIndexList = [];
        let refResourceList = [];

        for (let j = 0; j < currentRefResourceList.length; j++) {
            let refResourceInfo = currentRefResourceList[j];

            let paramType = findParamType(
                refResourceInfo.resource,
                chainParam.split(":").shift()
            );
            if (!paramType) {
                removeIndexList.push(j);
                continue;
            }

            delete require.cache[
                require.resolve(
                    `../../FHIR/${refResourceInfo.resource}/${refResourceInfo.resource}ParametersHandler.js`
                )
            ];
            let { paramsSearchFields } = require(
                `../../FHIR/${refResourceInfo.resource}/${refResourceInfo.resource}ParametersHandler.js`
            );

            if (paramType === "reference" && i != chainParamList.length - 1) {
                let paramRefResources = resourceIncludeRef[
                    refResourceInfo.resource
                ].find((v) =>
                    paramsSearchFields[chianParamName][0].startsWith(v.path)
                ).resourceList;

                if (chainParam.includes(":")) {
                    if (!paramRefResources.includes(chainResourceType))
                        return { status: false };
                    else paramRefResources = [chainResourceType];
                }

                for (let refResource of paramRefResources) {
                    if (refResource === "Resource") continue;

                    refResourceList.push({
                        param: chianParamName,
                        resource: refResource,
                        field: paramsSearchFields[chianParamName][0],
                        parent: refResourceInfo.resource,
                        parentKey: refResourceInfo.key,
                        key: uuid.v4()
                    });
                }
            } else {
                currentRefResourceList = currentRefResourceList.map(
                    (v, index) => {
                        if (!removeIndexList.includes(index)) return v;
                    }
                );
                currentRefResourceList = _.compact(currentRefResourceList);
                chainRefResourceList[chainRefResourceList.length - 1] =
                    currentRefResourceList;
                getChainParam(chainParam, chainRefResourceList);
                return {
                    status: true,
                    chainParent: chainRefResourceList
                };
            }
        }
        currentRefResourceList = currentRefResourceList.map((v, index) => {
            if (!removeIndexList.includes(index)) return v;
        });
        currentRefResourceList = _.compact(currentRefResourceList);
        chainRefResourceList[chainRefResourceList.length - 1] =
            currentRefResourceList;

        if (refResourceList.length > 0)
            chainRefResourceList.push(refResourceList);
    }

    return { status: false };
}

/**
 *
 * @param {string} lastParam
 * @param {Object[]} chainParent
 */
function getChainParam(lastParam, chainParent) {
    let lastParent = _.last(chainParent)[0];
    let { resource, key } = lastParent;

    let { paramsSearch, paramsSearchFields } = require(
        `../../FHIR/${resource}/${resource}ParametersHandler.js`
    );
    chainParent.push([
        {
            param: lastParam,
            field: paramsSearchFields[lastParam][0],
            searchFunc: paramsSearch[lastParam],
            parent: resource,
            parentKey: key,
            key: uuid.v4()
        }
    ]);
}

/**
 *
 * @param {string} resourceType
 * @param {string} param
 */
function checkIsChainAndGetChainParent(resourceType, param) {
    try {
        let paramSplit = param.split(".");
        if (paramSplit.length <= 1)
            return {
                status: false
            };

        let chainRefResourceList = [];

        // 1. Check the first parameter present in string
        //   1.1 Must be parameter of resource type.
        // 2. Record every reference resourceType
        //   2.1 If colon (:) present, that mean user specific the resource type of current reference parameter
        //   2.2 Else, record all information(resourceType, searchParameter, searchFieldInResource) of resource type from current reference parameter
        let selfParam = paramSplit.shift();
        let [firstParam, specificResource] = selfParam.split(":");

        delete require.cache[
            require.resolve(
                `../../FHIR/${resourceType}/${resourceType}ParametersHandler.js`
            )
        ];
        let { paramsSearchFields } = require(
            `../../FHIR/${resourceType}/${resourceType}ParametersHandler.js`
        );
        if (firstParam in paramsSearchFields) {
            let paramType = findParamType(resourceType, firstParam);
            if (!paramType) return { status: false };
            else if (paramType !== "reference") return { status: false };

            let paramRefResources = resourceIncludeRef[resourceType].find((v) =>
                paramsSearchFields[firstParam][0].startsWith(v.path)
            ).resourceList;

            if (selfParam.includes(":")) {
                if (!paramRefResources.includes(specificResource))
                    return { status: false };
                else paramRefResources = [specificResource];
            }

            let refResourceList = [];
            for (let refResource of paramRefResources) {
                if (refResource === "Resource") continue;

                refResourceList.push({
                    param: firstParam,
                    resource: refResource,
                    field: paramsSearchFields[firstParam][0],
                    key: uuid.v4()
                });
            }
            if (refResourceList.length > 0)
                chainRefResourceList.push(refResourceList);
        }

        return getChainParent(paramSplit, chainRefResourceList);
    } catch (e) {
        console.log(e);
    }
}

/**
 *
 * @param {Object[]} chainParent
 */
function getChainParentJoinQuery(chainParent, value) {
    try {
        let pipeline = [];
        let lastParentFieldList = [];

        for (let i = 0; i < chainParent.length - 1; i++) {
            let stageParents = chainParent[i];

            for (let index in stageParents) {
                let parent = stageParents[index];
                let hasParent = _.get(parent, "parent", false);

                let previousKey = hasParent ? _.get(parent, `parentKey`) : "";

                //#region unwind search parameter's field
                // I don't know the reference is array or object, so unwind every path separate with dot
                let fieldSplit = parent.field.split(".");
                let fieldList = [fieldSplit.shift()];

                for (let j = 0; j < fieldSplit.length; j++) {
                    fieldList.push(`${_.last(fieldList)}.${fieldSplit[j]}`);
                }

                fieldList.forEach((v) =>
                    pipeline.push({
                        $unwind: {
                            path: hasParent
                                ? `$stage${i - 1}Ref${
                                      parent.parent
                                  }-${previousKey}.${v}`
                                : `\$${v}`,
                            preserveNullAndEmptyArrays: true
                        }
                    })
                );
                //#endregion

                let query = {
                    $lookup: {
                        from: parent.resource,
                        let: {
                            refId: {
                                $substr: [
                                    hasParent
                                        ? `$stage${i - 1}Ref${
                                              parent.parent
                                          }-${previousKey}.${parent.field}`
                                        : `\$${parent.field}`,
                                    parent.resource.length + 1,
                                    -1
                                ]
                            }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$id", "$$refId"]
                                    }
                                }
                            }
                        ],
                        as: `stage${i}Ref${parent.resource}-${parent.key}`
                    }
                };

                if (i == chainParent.length - 2) {
                    let lastChain = chainParent[i + 1][0];
                    let originalQuery = {
                        $and: [],
                        [lastChain.param]: value
                    };
                    lastChain["searchFunc"](originalQuery);
                    query.$lookup.pipeline.push({
                        $match: {
                            $and: originalQuery.$and
                        }
                    });
                    lastParentFieldList.push({
                        [`stage${i}Ref${parent.resource}-${parent.key}`]: {
                            $exists: true
                        }
                    });
                }

                pipeline.push(query);
                pipeline.push({
                    $unwind: {
                        path: `$stage${i}Ref${parent.resource}-${parent.key}`,
                        preserveNullAndEmptyArrays: true
                    }
                });
            }
        }

        pipeline.push({
            $match: {
                $or: lastParentFieldList
            }
        });
        return pipeline;
    } catch (e) {
        console.error(e);
    }
}

module.exports.checkIsChainAndGetChainParent = checkIsChainAndGetChainParent;
module.exports.getChainParentJoinQuery = getChainParentJoinQuery;
