const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    DetectedIssue_Evidence
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DetectedIssue_Evidence.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    detail: {
        type: [Reference],
        default: void 0
    }
});
module.exports.DetectedIssue_Evidence = DetectedIssue_Evidence;
