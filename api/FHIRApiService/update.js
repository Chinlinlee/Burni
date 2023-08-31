const mongodb = require("models/mongodb");
const _ = require("lodash");
const FHIR = require("fhir").Fhir;
const { validateContainedList } = require("./validateContained");
const { renameCollectionFieldName } = require("../apiService");
const { logger } = require("../../utils/log");
const path = require("path");
const {
    issue,
    OperationOutcome,
    handleError
} = require("../../models/FHIR/httpMessage");
/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do update] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}]`
    );
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item._doc);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let resFunc = {
        true: (data) => {
            if (data.code == 201) {
                let reqBaseUrl = `${req.protocol}://${req.get("host")}/`;
                let fullAbsoluteUrl = new URL(req.originalUrl, reqBaseUrl).href;
                res.set("Location", fullAbsoluteUrl);
            }
            res.append("Last-Modified", new Date().toUTCString());
            return doRes(data.code, data.doc);
        },
        false: (err) => {
            let operationOutcomeMessage;
            if (err.message.code == 11000) {
                operationOutcomeMessage = {
                    code: 409,
                    msg: handleError.duplicate(err.message)
                };
            } else if (err.stack.includes("ValidationError")) {
                let operationOutcomeError = new OperationOutcome([]);
                for (let errorKey in err.errors) {
                    let error = err.errors[errorKey];
                    let message = _.get(error, "message", `${error} invalid`);
                    let errorIssue = new issue("error", "invalid", message);
                    _.set(errorIssue, "location", [errorKey]);
                    operationOutcomeError.issue.push(errorIssue);
                }
                operationOutcomeMessage = {
                    code: 400,
                    msg: operationOutcomeError
                };
            } else if (err.stack.includes("stored by resource")) {
                operationOutcomeMessage = {
                    code: 400,
                    msg: handleError.processing(err.message)
                };
            } else {
                operationOutcomeMessage = {
                    code: 500,
                    msg: handleError.exception(err.message)
                };
            }
            logger.error(
                `[Error: ${JSON.stringify(
                    operationOutcomeMessage
                )}] [Resource Type: ${resourceType}]`
            );
            return doRes(
                operationOutcomeMessage.code,
                operationOutcomeMessage.msg
            );
        }
    };

    let updateData = req.body;
    let updateDataClone = _.cloneDeep(updateData);

    // Validate user request body
    if (process.env.ENABLE_VALIDATOR === "true") {
        let { validateResource } = require("../../utils/validator/processor");
        let validationResult = await validateResource(req.body);

        if (validationResult.isError)
            return doRes(422, validationResult.message);
    } else {
        let containedValidation = await validateContainedList(updateData);
        if (!containedValidation.status) {
            let operationOutcomeError = handleError.processing(
                `The resource in contained error. ${containedValidation.message}`
            );
            logger.error(
                `[Error: ${JSON.stringify(
                    operationOutcomeError
                )}] [Resource Type: ${resourceType}]`
            );
            return doRes(422, operationOutcomeError);
        }
    }

    let dataExist = await isDocExist(req.params.id, resourceType);
    if (dataExist.status == 0) {
        let errorStr = JSON.stringify(
            dataExist.error,
            Object.getOwnPropertyNames(dataExist.error)
        );
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}]`);
        return doRes(500, handleError.exception(dataExist.error));
    }
    let dataFuncAfterCheckExist = {
        1: doUpdateData,
        2: doInsertData
    };
    let [status, result] = await dataFuncAfterCheckExist[dataExist.status](
        updateDataClone,
        req.params.id,
        resourceType
    );

    return resFunc[status](result);
};

async function isDocExist(id, resourceType) {
    try {
        let data = await mongodb[resourceType]
            .countDocuments({ id: id })
            .limit(1);
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
    } catch (e) {
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
        let newDoc = await mongodb[resourceType].findOneAndUpdate(
            {
                id: id
            },
            {
                $set: data
            },
            {
                new: true,
                rawResult: true
            }
        );
        return [
            "true",
            {
                id: id,
                doc: newDoc.value.getFHIRField(),
                code: 200
            }
        ];
    } catch (e) {
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
        return [
            "true",
            {
                code: 201,
                doc: doc.getFHIRField()
            }
        ];
    } catch (e) {
        console.error(e);
        return ["false", e];
    }
}
