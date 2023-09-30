const _ = require("lodash");
const { FhirWebServiceError, handleError, FhirValidationError } = require("@root/models/FHIR/httpMessage");
const { BundleOpService } = require("./services/bundle-operations.service");
const { logger } = require("@root/utils/log");


/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
module.exports = async function (req, res) {
    try {
        let bundleOpService = new BundleOpService(req, res);
        let bundleResponse = await bundleOpService.doOp();
        return res.status(200).send(bundleResponse);
    } catch(e) {
        if (e instanceof FhirWebServiceError || e instanceof FhirValidationError) {
            return res.status(e.code).send(e.operationOutcome);
        } else if (_.get(e, "name", "") === "ValidationError") {
            return res.status(400).send(handleError.processing(e));
        }
        logger.error(e);
        return res.status(500).send(handleError.processing(new Error("Server Error Occurred")));
    }
}
