const mongodb = require('models/mongodb');
const {
    handleError
} = require('models/FHIR/httpMessage');
const _ = require('lodash');
const user = require('../APIservices/user.service');
const FHIR = require('fhir').Fhir;
const validateContained = require('./validateContained');
const { checkReference, getNotExistReferenceList } = require('../apiService');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function (req, res, resourceType) {
    logger.info(`[Info: do create] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}] [Content-Type: ${res.getHeader("content-type")}]`);
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!await user.checkTokenPermission(req, resourceType, "update")) {
        logger.warn(`[Warn: Request token doesn't have permission with this API] [From-File: ${PWD_FILENAME}] [From-IP: ${req.socket.remoteAddress}]`);
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
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
    if (process.env.ENABLE_CHECK_REFERENCE == "true") {
        let checkReferenceRes = await checkReference(updateData);
        if (!checkReferenceRes.status) {
            let notExistReferenceList = getNotExistReferenceList(checkReferenceRes);
            let operationOutcomeError = handleError.processing(`The reference not found : ${_.map(notExistReferenceList , "value").join(",")}`);
            _.set(operationOutcomeError , "issue.0.location" , _.map(notExistReferenceList , "path"));
            return doRes(400, operationOutcomeError);
        }
    }
    let dataExist = await isDocExist(req.params.id, resourceType);
    if (dataExist.status == 0) {
        let errorStr = JSON.stringify(dataExist.error, Object.getOwnPropertyNames(dataExist.error));
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
        return doRes(500, handleError.exception(dataExist.error));
    }
    let dataFuncAfterCheckExist = {
        1: doUpdateData,
        2: doInsertData
    };
    let [status, result] = await dataFuncAfterCheckExist[dataExist.status](req,resourceType);
    
    return resFunc[status](result);
};

async function isDocExist(id,resourceType) {
    try {
        let doc = await mongodb[resourceType].findOne({ id: id });
        if (doc) {
            return {
                status: 1,
                error: ""
            }; //have doc
        } else {
            return {
                status: 2,
                error: ""
            }; //no doc
        }
    } catch(e) {
        return {
            status: 0,
            error: e
        }; //error
    }
}

function doUpdateData(req,resourceType) {
    return new Promise((resolve, reject) => {
        let data = req.body;
        let id = req.params.id;
        delete data._id;
        delete data.text;
        delete data.meta;
        data.id = id;
        mongodb[resourceType].findOneAndUpdate({
            id: id
        }, {
            $set: data
        }, {
            new: true,
            rawResult: true
        }, function (err, newDoc) {
            if (err) {
                console.error(err);
                return resolve(["false", err]);
            }
            return resolve(["true", {
                id: id,
                doc: newDoc.value.getFHIRField(),
                code: 200
            }]);
        });
    });
}

function doInsertData(req,resourceType) {
    return new Promise((resolve) => {
        let data = req.body;
        data.id = req.params.id;
        delete data.text;
        delete data.meta;
        let updateData = new mongodb[resourceType](data);
        updateData.save(function (err, doc) {
            if (err) {
                console.error(err);
                return resolve(["false", err]);
            }
            return resolve(["true", {
                code: 201,
                doc: doc.getFHIRField()
            }]);
        });
    });
}