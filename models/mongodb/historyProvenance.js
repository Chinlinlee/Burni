const _ = require("lodash");

const RESOURCES_WITH_FHIR_REQUEST_FIELD = new Set([
    "ClaimResponse",
    "PaymentNotice",
    "BiologicallyDerivedProduct",
    "MedicationAdministration",
    "CoverageEligibilityResponse",
    "EnrollmentResponse",
    "Specimen",
    "PaymentReconciliation"
]);

const RESOURCES_WITH_FHIR_RESPONSE_FIELD = new Set([
    "MessageHeader",
    "PaymentNotice"
]);

function isHttpProvenanceRequest(value) {
    return Boolean(
        value &&
        typeof value === "object" &&
        typeof value.method === "string" &&
        typeof value.url === "string" &&
        value.reference === undefined
    );
}

function isHttpProvenanceResponse(value) {
    return Boolean(
        value &&
        typeof value === "object" &&
        typeof value.status === "string" &&
        value.method === undefined &&
        value.url === undefined &&
        value.reference === undefined
    );
}

function setHistoryProvenance(item, { method, url, status }) {
    _.set(item, "bundleRequest", {
        method,
        url
    });
    _.set(item, "bundleResponse", {
        status: String(status)
    });
}

function extractBundleProvenance(doc) {
    const request = doc.bundleRequest || (isHttpProvenanceRequest(doc.request) ? doc.request : undefined);
    const response = doc.bundleResponse || (isHttpProvenanceResponse(doc.response) ? doc.response : undefined);
    return {
        request,
        response
    };
}

function stripHistoryProvenanceForVread(result) {
    delete result._id;
    delete result.__v;
    delete result["name._id"];
    delete result.bundleRequest;
    delete result.bundleResponse;
    if (isHttpProvenanceRequest(result.request)) {
        delete result.request;
    }
    if (isHttpProvenanceResponse(result.response)) {
        delete result.response;
    }
    return result;
}

function stripInternalProvenanceFields(doc) {
    const clone = _.cloneDeep(doc);
    delete clone.bundleRequest;
    delete clone.bundleResponse;
    if (isHttpProvenanceRequest(clone.request)) {
        delete clone.request;
    }
    if (isHttpProvenanceResponse(clone.response)) {
        delete clone.response;
    }
    return clone;
}

module.exports = {
    isHttpProvenanceRequest,
    isHttpProvenanceResponse,
    setHistoryProvenance,
    extractBundleProvenance,
    stripHistoryProvenanceForVread,
    stripInternalProvenanceFields
};
