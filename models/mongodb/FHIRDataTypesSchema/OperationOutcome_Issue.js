const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    OperationOutcome_Issue
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
OperationOutcome_Issue.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    severity: {
        type: String,
        enum: ["fatal", "error", "warning", "information"],
        default: void 0
    },
    code: {
        type: String,
        enum: [
            "invalid",
            "structure",
            "required",
            "value",
            "invariant",
            "security",
            "login",
            "unknown",
            "expired",
            "forbidden",
            "suppressed",
            "processing",
            "not-supported",
            "duplicate",
            "multiple-matches",
            "not-found",
            "deleted",
            "too-long",
            "code-invalid",
            "extension",
            "too-costly",
            "business-rule",
            "conflict",
            "transient",
            "lock-error",
            "no-store",
            "exception",
            "timeout",
            "incomplete",
            "throttled",
            "informational"
        ],
        default: void 0
    },
    details: {
        type: CodeableConcept,
        default: void 0
    },
    diagnostics: string,
    location: {
        type: [string],
        default: void 0
    },
    expression: {
        type: [string],
        default: void 0
    }
});
module.exports.OperationOutcome_Issue = OperationOutcome_Issue;
