const mongodb = require('models/mongodb');
const {
    getDeleteMessage,
    handleError
} = require('../../models/FHIR/httpMessage');
const _ = require('lodash');
const FHIR = require('../../models/FHIR/fhir/fhir').Fhir;
const { user } = require('../apiService');

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function(req, res, resourceType) {
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!user.checkTokenPermission(req, resourceType, "detele")) {
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    let resFunc = {
        "true": (doc) => {
            if (!doc) {
                let errorMessage = `not found ${resourceType}/${req.params.id}`;
                return doRes(404,handleError["not-found"](errorMessage));
            }
            return doRes(200,getDeleteMessage(resourceType, req.params.id));
        },
        "false": (err) => {
            if (_.isString(err)) {
                if (err.includes("not found")) {
                    return doRes(404, handleError['not-found'](err));
                }
                return doRes(500,handleError.exception(err));
            }
            return doRes(500,handleError.exception(err.message));
        }
    };
    let [status, doc] = await doDeleteData(req, resourceType);
    return resFunc[status.toString()](doc);
};

async function doDeleteData(req, resourceType) {
    return new Promise((resolve) => {
        const id = req.params.id;
        mongodb[resourceType].findOneAndDelete({
            id: id
        }, (err, doc) => {
            if (err) {
                console.error(err);
                return resolve([false, err]);
            }
            return resolve([true, doc]);
        });
    });
}