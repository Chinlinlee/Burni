const mongodb = require('models/mongodb');
const {
    handleError
} = require('models/FHIR/httpMessage');
const _ = require('lodash');

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function (req, res, resourceType) {
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    }
    let resFunc = {
        "true": (data) => {
            return doRes(data.code, data.doc);
        },
        "false": (error) => {
            if (_.isString(err)) {
                return doRes(500 , handleError.exception(error));
            }
            return doRes(500, handleError.exception(error.message));
        }
    }
    let dataExist = await isDocExist(req.params.id, resourceType);
    if (dataExist.status == 0) {
        return doRes(500, handleError.exception(dataExist.error))
    }
    let dataFuncAfterCheckExist = {
        0: (req,resourceType) => {
            return ["false", ""];
        },
        1: doUpdateData,
        2: doInsertData
    }
    let [status, result] = await dataFuncAfterCheckExist[dataExist.status](req,resourceType);
    return resFunc[status](result);
}

function isDocExist(id,resourceType) {
    return new Promise(async (resolve, reject) => {
        mongodb[resourceType].findOne({
            id: id
        }, async function (err, doc) {
            if (err) {
                return resolve({
                    status: 0,
                    error: err
                }); //error
            }
            if (doc) {
                return resolve({
                    status: 1,
                    error: ""
                }); //have doc
            } else {
                return resolve({
                    status: 2,
                    error: ""
                }); //no doc
            }
        });
    });
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