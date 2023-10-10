const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    HealthcareService_Eligibility
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
HealthcareService_Eligibility.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    comment: markdown
});
module.exports.HealthcareService_Eligibility = HealthcareService_Eligibility;
