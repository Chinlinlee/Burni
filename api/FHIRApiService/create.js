const mongodb = require('models/mongodb');
const {
    handleError
} = require('../../models/FHIR/httpMessage');
const uuid = require('uuid');
const _ = require('lodash');
const { checkReference, getNotExistReferenceList } = require('../apiService');
const FHIR = require('../../models/FHIR/fhir/fhir').Fhir;
const { user } = require('../apiService');
const validateContained = require('./validateContained');

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function(req, res , resourceType) {
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!user.checkTokenPermission(req, resourceType, "create")) {
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    console.log(`doPost-create ${resourceType}`);
    try {
        let resFunc = {
            "true": (doc) => {
                let reqBaseUrl = `${req.protocol}://${req.get('host')}/`;
                let fullAbsoluteUrl = new URL(req.originalUrl, reqBaseUrl).href;
                res.set("Location", fullAbsoluteUrl);
                res.append("Last-Modified", (new Date()).toUTCString());
                console.log(`create ${resourceType} id: ${doc.id} successfully`);
                return doRes(201 , doc);
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
        let insertData = req.body;
        if (_.get(insertData, "contained")) {
            let containedResources = _.get(insertData, "contained");
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
            let checkReferenceRes = await checkReference(insertData);
            if (!checkReferenceRes.status) {
                let notExistReferenceList = getNotExistReferenceList(checkReferenceRes);
                let operationOutcomeError = handleError.processing(`The reference not found : ${_.map(notExistReferenceList , "value").join(",")}`);
                _.set(operationOutcomeError , "issue.0.location" , _.map(notExistReferenceList , "path"));
                return doRes(400, operationOutcomeError);
            }
        }
        let [status, doc] = await doInsertData(insertData, resourceType);
        return resFunc[status](doc);
    } catch (e) {
        console.error(e);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500 , operationOutcomeError);
    }
};

async function doInsertData(insertData , resourceType) {
    try {
        delete insertData.text;
        //delete insertData.meta;
        insertData.id = uuid.v4();
        let insertDataObject = new mongodb[resourceType](insertData);
        let doc = await insertDataObject.save();
        return [true, doc.getFHIRField()];
    } catch (e) {
        console.error(e);
        return [false , e];
    }
}