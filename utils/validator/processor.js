const { validator } = require("./index.js");

/**
 *
 * @param {Object} resource
 */
async function validateResource(resource) {
    let operationOutcome = await validator.validateFromBuffer(
        Buffer.from(JSON.stringify(resource)),
        resource.meta?.profile?.join(",")
    );

    if (Object.prototype.hasOwnProperty.call(operationOutcome, "issue")) {
        return {
            isError: operationOutcome.issue.some(
                (v) => v.severity === "error" || v.severity === "fatal"
            ),
            message: operationOutcome
        };
    }

    return {
        isError: false,
        message: operationOutcome
    };
}

module.exports.validateResource = validateResource;
