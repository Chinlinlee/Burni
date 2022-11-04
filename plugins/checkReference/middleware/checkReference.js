const _ = require("lodash");
const { logger } = require("../../../utils/log");
const { doRes } = require("../../../utils/response");
const {
    handleError
} = require('../../../models/FHIR/httpMessage');
const FHIR = require("fhir").Fhir;
const { isDocExist } = require("../../../api/apiService");
const jp = require("jsonpath");

async function checkAbsoluteUrlRef(key, referenceValue, checkedReferenceList) {
    //do fetch to get response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1268 + 1231);
    try {
        let fetchRes = await fetch(referenceValue, {
            headers: {
                accept: "application/fhir+json"
            } ,
            signal: controller.signal
        });
        if (fetchRes.status == 200) {
            let referenceJson = await fetchRes.json();
            let fhir = new FHIR();
            if (fhir.validate(referenceJson).valid) {
                checkedReferenceList.push({
                    exist: true,
                    path: key,
                    value: referenceValue
                });
            } else {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        } else {
            checkedReferenceList.push({
                exist: false,
                path: key,
                value: referenceValue
            });
        }
    } catch (e) {
        checkedReferenceList.push({
            exist: false,
            path: key,
            value: referenceValue
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function checkReference(resourceData) {
    let checkedReferenceList = [];
    let referenceKeysJp = jp.paths(resourceData, "$..reference").map( v=> v.join(".").substring(2));
    for (let key of referenceKeysJp) {
        let referenceValue = _.get(resourceData, key);
        let referenceValueSplit = referenceValue.split('|')[0].split('/');
        if (/^(http|https):\/\//g.test(referenceValue)) {
            await checkAbsoluteUrlRef(key, referenceValue, checkedReferenceList);
        } else if (referenceValueSplit.length >= 2) {
            let resourceName = referenceValueSplit[referenceValueSplit.length - 2];
            let resourceId = referenceValueSplit[referenceValueSplit.length - 1];
            let doc = await isDocExist(resourceId, resourceName);
            if (doc.status === 1) {
                checkedReferenceList.push({
                    exist: true,
                    path: key,
                    value: referenceValue
                });
            } else {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        } else if (/urn:oid:[0-2](\.[1-9]\d*)+/i.test(referenceValue) ||
            /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referenceValue)) {
            //Only Bundle entry have OID or UUID reference?
            let referenceTargetFullUrl = jp.nodes(resourceData, "$..fullUrl").find( v=> v.value === referenceValue);
            if (referenceTargetFullUrl) {
                checkedReferenceList.push({
                    exist: true,
                    path: key,
                    value: referenceValue
                });
            } else {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        }
    }
    if (checkedReferenceList.length > 0) {
        return {
            status : checkedReferenceList.every(v=> v.exist),
            checkedReferenceList: checkedReferenceList
        };
    }
    return {
        status: true,
        checkedReferenceList: checkedReferenceList
    };
}

function getNotExistReferenceList(checkReferenceRes) {
    let notExistReferenceList = [];
    for (let reference of checkReferenceRes.checkedReferenceList) {
        if (!reference.exist) {
            notExistReferenceList.push({
                path: reference.path ,
                value: reference.value
            });
        }
    }
    return notExistReferenceList;
}

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 * @returns 
 */
async function checkReferenceMiddleware(req, res, next) {
    let resourceType = _.get(req.params, "resourceType");
    let resourceData = _.cloneDeep(req.body);
    let checkReferenceRes = await checkReference(resourceData);
    if (!checkReferenceRes.status) {
        let notExistReferenceList = getNotExistReferenceList(checkReferenceRes);
        let operationOutcomeError = handleError.processing(`The reference not found : ${_.map(notExistReferenceList , "value").join(",")}`);
        _.set(operationOutcomeError , "issue.0.location" , _.map(notExistReferenceList , "path"));
        logger.error(`[Error: ${JSON.stringify(operationOutcomeError)}] [Resource Type: ${resourceType}]`);
        return doRes(req, res, 400, operationOutcomeError);
    }
    next();
}


module.exports.checkReferenceMiddleware = checkReferenceMiddleware;