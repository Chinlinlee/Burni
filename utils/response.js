const FHIR = require("fhir").Fhir;
const _ = require("lodash");

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {string} code 
 * @param {Object} item 
 * @returns 
 */
 let doRes = function (req, res, code, item) {
    let acceptHeader = _.get(req.headers, "accept", "");
    if (acceptHeader.includes("xml")) {
        let fhir = new FHIR();
        let xmlItem = fhir.objToXml(item);
        return res.status(code).send(xmlItem);
    }
    return res.status(code).send(item);
};

module.exports.doRes = doRes;