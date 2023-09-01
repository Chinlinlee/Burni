const mongodb = require("models/mongodb");
const {
    getDeleteMessage,
    handleError
} = require("../../models/FHIR/httpMessage");
const _ = require("lodash");
const FHIR = require("fhir").Fhir;
const { logger } = require("../../utils/log");
const path = require("path");

const responseFunc = {
    /**
     *
     * @param {Object} doc
     * @param {import('express').Request} req express request
     * @param {import('express').Response} res express response
     * @param {string} resourceType resource type
     * @param {function} doResCallback callback function
     * @returns
     */
    true: (doc, req, res, resourceType, doCallback) => {
        if (!doc) {
            let errorMessage = `not found ${resourceType}/${req.params.id}`;
            logger.warn(
                `[Warn: ${errorMessage}] [Resource-Type: ${resourceType}]`
            );
            return doCallback(404, handleError["not-found"](errorMessage));
        }
        return doCallback(200, getDeleteMessage(resourceType, req.params.id));
    },
    /**
     *
     * @param {Object} err
     * @param {import('express').Request} req express request
     * @param {import('express').Response} res express response
     * @param {string} resourceType resource type
     * @param {function} doResCallback callback function
     * @returns
     */
    false: (err, req, res, resourceType, doCallback) => {
        if (_.isString(err)) {
            if (err.includes("not found")) {
                return doCallback(404, handleError["not-found"](err));
            }
            return doCallback(500, handleError.exception(err));
        }
        return doCallback(500, handleError.exception(err.message));
    }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do delete by id, id: ${
            req.params.id
        }] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}]`
    );
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };

    let [status, doc] = await doDeleteData(req, resourceType);
    return responseFunc[status.toString()](doc, req, res, resourceType, doRes);
};

async function doDeleteData(req, resourceType) {
    return new Promise((resolve) => {
        const id = req.params.id;
        mongodb[resourceType].findOneAndDelete(
            {
                id: id
            },
            (err, doc) => {
                if (err) {
                    let errorStr = JSON.stringify(
                        err,
                        Object.getOwnPropertyNames(err)
                    );
                    logger.error(
                        `[Error ${errorStr}] [Resource Type: ${resourceType}]`
                    );
                    return resolve([false, err]);
                }
                return resolve([true, doc]);
            }
        );
    });
}
