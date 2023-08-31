const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    DetectedIssue_Mitigation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DetectedIssue_Mitigation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    date: dateTime,
    author: {
        type: Reference,
        default: void 0
    }
});
module.exports.DetectedIssue_Mitigation = DetectedIssue_Mitigation;
