const nodeFetch = require("node-fetch");
const AbortController = require("abort-controller");
const { handleError } = require("../../models/FHIR/httpMessage");
const { getValidatorTimeoutMs } = require("./config");

/** @type {typeof nodeFetch} */
let fetchImpl = nodeFetch;

/**
 * @param {typeof nodeFetch} fetch
 */
function setFetch(fetch) {
    fetchImpl = fetch;
}

/**
 * @param {Object} resource
 * @returns {string}
 */
function buildValidatorUrl(resource) {
    const url = new URL(process.env.VALIDATOR_URL);
    const profiles = resource.meta?.profile;
    if (profiles && profiles.length > 0) {
        url.searchParams.set("profile", profiles.join(","));
    }
    return url.toString();
}

/**
 * @param {Object} operationOutcome
 * @returns {{ code: number, operationOutcome: Object }}
 */
function mapOperationOutcome(operationOutcome) {
    const hasError = operationOutcome.issue?.some(
        (issue) => issue.severity === "error" || issue.severity === "fatal"
    );

    return {
        code: hasError ? 422 : 200,
        operationOutcome
    };
}

/**
 * @param {Object} resource
 * @param {{ timeoutMs?: number }} [options]
 */
async function validateResource(resource, options = {}) {
    const timeoutMs = options.timeoutMs ?? getValidatorTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchImpl(buildValidatorUrl(resource), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resource),
            signal: controller.signal
        });

        let body;
        try {
            body = await response.json();
        } catch {
            return {
                code: 502,
                operationOutcome: handleError.exception(
                    "Validator response is not a valid OperationOutcome"
                )
            };
        }

        if (body?.resourceType !== "OperationOutcome") {
            return {
                code: 502,
                operationOutcome: handleError.exception(
                    "Validator response is not an OperationOutcome"
                )
            };
        }

        return mapOperationOutcome(body);
    } catch (e) {
        const message = e?.name === "AbortError"
            ? "Validator request timed out"
            : (e?.message || "Validator is unreachable");

        return {
            code: 503,
            operationOutcome: handleError.exception(message)
        };
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    validateResource,
    setFetch,
    mapOperationOutcome
};
