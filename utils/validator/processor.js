const { validator } = require("./index.js");

/**
 * 
 * @param {Object} resource 
 */
 async function validateResource(resource) {
    let operationOutcomeStr;

    let meta = Object.prototype.hasOwnProperty.call(resource, "meta") ? resource.meta : undefined;
    if (meta) {
        let profile = Object.prototype.hasOwnProperty.call(meta, "profile") ? meta.profile.join(",") : undefined;
        operationOutcomeStr = await validator.validateResource(JSON.stringify(resource), profile);
    }
    operationOutcomeStr = await validator.validateResource(JSON.stringify(resource), undefined);

    let operationOutcome = JSON.parse(operationOutcomeStr);
    if (Object.prototype.hasOwnProperty.call(operationOutcome, "issue")) {
        let isError = operationOutcome.issue.some(v => v.severity === "error");
        if (isError) {
            return operationOutcome;
        }
        return undefined;
    }
}

module.exports.validateResource = validateResource;
