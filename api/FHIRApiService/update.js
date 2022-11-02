const mongodb = require('models/mongodb');
const {
    handleError
} = require('models/FHIR/httpMessage');
const _ = require('lodash');
const FHIR = require('fhir').Fhir;
const validateContained = require('./validateContained');
const { checkReference, getNotExistReferenceList } = require('../apiService');
const { getValidateResult } = require('../../models/FHIR/fhir-validator.js');
const { renameCollectionFieldName } = require("../apiService");
const { logger } = require('../../utils/log');
const path = require('path');
/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function (req, res, resourceType) {
    logger.info(`[Info: do update] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader("content-type")}]`);
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let resFunc = {
        "true": (data) => {
            if (data.code == 201) {
                let reqBaseUrl = `${req.protocol}://${req.get('host')}/`;
                let fullAbsoluteUrl = new URL(req.originalUrl, reqBaseUrl).href;
                res.set("Location", fullAbsoluteUrl);
            }
            res.append("Last-Modified", (new Date()).toUTCString());
            return doRes(data.code, data.doc);
        },
        "false": (err) => {
            let operationOutcomeMessage;
                if (err.message.code == 11000) {
                    operationOutcomeMessage = {
                        code : 409 ,
                        msg : handleError.duplicate(err.message)
                    };
                } else if (err.stack.includes("ValidationError")) {
                    operationOutcomeMessage = {
                        code : 400 ,
                        msg : handleError.processing(err.message)
                    };
                } else if (err.stack.includes("stored by resource")) {
                    operationOutcomeMessage = {
                        code : 400 ,
                        msg : handleError.processing(err.message)
                    };
                } else {
                    operationOutcomeMessage = {
                        code : 500 ,
                        msg : handleError.exception(err.message)
                    };
                }
                return doRes(operationOutcomeMessage.code , operationOutcomeMessage.msg);
        }
    };
    let updateData = req.body;
    let updateDataClone = _.cloneDeep(updateData);
    if (_.get(updateData, "contained")) {
        let containedResources = _.get(updateData, "contained");
        for (let index in containedResources) {
            let resource = containedResources[index];
            let validation = await validateContained(resource, index);
            if (!validation.status) {
                let operationOutcomeError = handleError.processing(`The resource in contained error. ${validation.message}`);
                return doRes(400, operationOutcomeError);
            }
        }
    }
    if (process.env.ENABLE_VALIDATION_WHEN_OP === "true" && process.env.ENABLE_CSHARP_VALIDATOR === "true") {
        let operationOutcomeMessage = await getValidateResult(req, resourceType);
        let haveError = (_.get(operationOutcomeMessage, "issue")) ? operationOutcomeMessage.issue.find(v=> v.severity === "error") : false;
        if (haveError) {
            return doRes(412, operationOutcomeMessage);
        }
    }
    let dataExist = await isDocExist(req.params.id, resourceType);
    if (dataExist.status == 0) {
        let errorStr = JSON.stringify(dataExist.error, Object.getOwnPropertyNames(dataExist.error));
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}]`);
        return doRes(500, handleError.exception(dataExist.error));
    }
    let dataFuncAfterCheckExist = {
        1: doUpdateData,
        2: doInsertData
    };
    let [status, result] = await dataFuncAfterCheckExist[dataExist.status](updateDataClone, req.params.id, resourceType);
    
    return resFunc[status](result);
};

async function isDocExist(id, resourceType) {
    try {
        let data = await mongodb[resourceType].countDocuments({id: id}).limit(1);
        if (data > 0) {
            return {
                status: 1,
                error: ""
            };
        }
        return {
            status: 2,
            error: ""
        };
    } catch(e) {
        console.error(e);
        return {
            status: 0,
            error: e
        };
    }
}

async function doUpdateData(data, id, resourceType) {
    try {
        delete data._id;
        renameCollectionFieldName(data);
        data.id = id;
        let newDoc = await mongodb[resourceType].findOneAndUpdate({
            id: id
        }, {
            $set: data
        }, {
            new: true,
            rawResult: true
        });
        return ["true", {
            id: id,
            doc: newDoc.value.getFHIRField(),
            code: 200
        }];
    } catch(e) {
        console.error(e);
        return ["false", e];
    }
}

async function doInsertData(data, id, resourceType) {
    try {
        data.id = id;
        renameCollectionFieldName(data);
        let updateData = new mongodb[resourceType](data);
        let doc = await updateData.save();
        return ["true", {
            code: 201,
            doc: doc.getFHIRField()
        }];
    } catch(e) {
        console.error(e);
        return ["false", e];
    }
}